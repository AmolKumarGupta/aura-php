import { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "./runtime/tokens";
import { ENTRY_Y, layerCenterY } from "./runtime/types";
import type { ConsoleLine, RouteStep } from "./runtime/types";
import StackDiagram from "./runtime/StackDiagram";
import {
	BrowserViewport,
	ConsolePanel,
	RoutesBar,
} from "./runtime/BrowserViewport";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function baseSteps(): RouteStep[] {
	return [
		{
			i: 0,
			comp: "bridge",
			msg: "intercepted fetch() → wasm runtime",
			ms: 0.4,
		},
		{
			i: 1,
			comp: "kernel",
			msg: "http kernel · warm start · 6 middleware",
			ms: 0.9,
		},
	];
}

function resolveRoute(path: string): {
	steps: RouteStep[];
	stopLayer: number;
	status: number;
	statusText: string;
	totalMs: number;
	kb: string;
	view: "welcome" | "e404";
} {
	if (path === "/" || path === "") {
		const steps: RouteStep[] = [
			...baseSteps(),
			{
				i: 3,
				comp: "router",
				msg: "matched GET / → closure · welcome page",
				ms: 0.2,
			},
			{
				i: 4,
				comp: "blade",
				msg: "render welcome.blade.php · compiled view cached",
				ms: 0.5,
			},
		];
		return {
			steps,
			stopLayer: 4,
			status: 200,
			statusText: "OK",
			totalMs: 2.1,
			kb: "4.2",
			view: "welcome",
		};
	}
	const steps: RouteStep[] = [
		...baseSteps(),
		{
			i: 3,
			comp: "router",
			msg: `no match for GET ${path} — NotFoundHttpException`,
			ms: 0.2,
			cls: "err",
		},
	];
	return {
		steps,
		stopLayer: 3,
		status: 404,
		statusText: "Not Found",
		totalMs: 1.6,
		kb: "1.1",
		view: "e404",
	};
}

function normalize(v: string): string {
	let s = (v || "")
		.trim()
		.replace(/^https?:\/\//, "")
		.replace(/^localhost:8080/, "");
	if (!s.startsWith("/")) s = `/${s}`;
	return s === "" ? "/" : s;
}

let lineId = 0;

export default function RuntimeMachine() {
	const [busy, setBusy] = useState(false);
	const [booted, setBooted] = useState(false);
	const [activeLayers, setActiveLayers] = useState<Set<number>>(new Set());
	const [readyLayers, setReadyLayers] = useState<Set<number>>(new Set());
	const [packetY, setPacketY] = useState(ENTRY_Y);
	const [packetVisible, setPacketVisible] = useState(false);
	const [packetLabel, setPacketLabel] = useState("");
	const [packetOk, setPacketOk] = useState(false);
	const [lines, setLines] = useState<ConsoleLine[]>([]);
	const [addr, setAddr] = useState("localhost:8080/");
	const [activeRoute, setActiveRoute] = useState("/");
	const [view, setView] = useState<"boot" | "welcome" | "e404">("boot");
	const [painting, setPainting] = useState(false);
	const [respMeta, setRespMeta] = useState("runtime offline — booting…");
	const [respOk, setRespOk] = useState<boolean | null>(null);
	const [bootProgress, setBootProgress] = useState(0);
	const [bootMeta, setBootMeta] = useState("resolving php-wasm…");
	const [reqN, setReqN] = useState(0);
	const [reqSum, setReqSum] = useState(0);
	const simRef = useRef(0);
	const busyRef = useRef(false);
	const bootedRef = useRef(false);
	const lastPathRef = useRef("/");

	const fmtT = () => `+${(simRef.current / 1000).toFixed(4)}`;

	const pushLine = useCallback(
		(t: string, comp: string, msg: string, ms = "", cls = "") => {
			lineId += 1;
			const id = lineId;
			setLines((prev) => [...prev, { id, t, comp, msg, ms, cls }]);
		},
		[],
	);

	const markReady = useCallback((idx: number[]) => {
		setReadyLayers((prev) => {
			const next = new Set(prev);
			for (const i of idx) next.add(i);
			return next;
		});
	}, []);

	const activate = useCallback((i: number) => {
		setActiveLayers((prev) => {
			const next = new Set(prev);
			next.add(i);
			return next;
		});
	}, []);

	const clearActiveStaggered = useCallback(() => {
		// stagger removal to mimic reference
		for (let i = 0; i < 6; i += 1) {
			window.setTimeout(() => {
				setActiveLayers((prev) => {
					const next = new Set(prev);
					next.delete(i);
					return next;
				});
			}, i * 55);
		}
	}, []);

	const packetYRef = useRef(ENTRY_Y);

	const animatePacketTo = useCallback((toY: number, dur: number) => {
		return new Promise<void>((res) => {
			const fromY = packetYRef.current;
			if (dur <= 0) {
				packetYRef.current = toY;
				setPacketY(toY);
				return res();
			}
			const t0 = performance.now();
			const step = (t: number) => {
				const p = Math.min(1, (t - t0) / dur);
				const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
				const y = fromY + (toY - fromY) * e;
				packetYRef.current = y;
				setPacketY(y);
				if (p < 1) requestAnimationFrame(step);
				else res();
			};
			requestAnimationFrame(step);
		});
	}, []);

	const runRequest = useCallback(
		async (rawPath: string) => {
			if (busyRef.current || !bootedRef.current) return;
			const path = normalize(rawPath);
			lastPathRef.current = path;
			setActiveRoute(path === "/" ? "/" : path);
			busyRef.current = true;
			setBusy(true);
			const R = resolveRoute(path);
			simRef.current = 0;
			pushLine(fmtT(), "bridge", `▸ GET ${path}`, "", "req");
			setPacketLabel(`GET ${path}`);
			setPacketOk(false);
			setPacketVisible(true);
			await animatePacketTo(ENTRY_Y, 150);
			for (const st of R.steps) {
				await animatePacketTo(layerCenterY(st.i), 235);
				activate(st.i);
				simRef.current += st.ms;
				pushLine(
					fmtT(),
					st.comp,
					st.msg,
					st.ms ? `${st.ms.toFixed(2)} ms` : "",
					st.cls || "",
				);
				await sleep(140 + st.ms * 300);
			}
			setPacketLabel(R.status >= 400 ? String(R.status) : "200 OK");
			setPacketOk(R.status < 400);
		for (let i = R.stopLayer; i >= 0; i -= 1) {
			await animatePacketTo(layerCenterY(i), 150);
		}
			simRef.current += 0.2;
			pushLine(
				fmtT(),
				"bridge",
				`◂ ${R.status} ${R.statusText} · text/html · ${R.kb} KB`,
				`${R.totalMs.toFixed(1)} ms`,
				R.status >= 400 ? "err" : "ok",
			);
			await animatePacketTo(ENTRY_Y, 140);
			setPacketVisible(false);
			setPainting(true);
			window.setTimeout(() => {
				setView(R.view);
				setPainting(false);
			}, 170);
			setRespMeta(
				`${R.status} ${R.statusText} · text/html · ${R.kb} KB · ${R.totalMs.toFixed(1)} ms · served from memory`,
			);
			setRespOk(R.status < 400);
			setAddr(`localhost:8080${path}`);
			setReqN((n) => {
				const nn = n + 1;
				setReqSum((s) => s + R.totalMs);
				return nn;
			});
			clearActiveStaggered();
			busyRef.current = false;
			setBusy(false);
		},
		[activate, animatePacketTo, clearActiveStaggered, pushLine],
	);

	// derived average — computed during render, no effect needed
	const avgMs = reqN > 0 ? (reqSum / reqN).toFixed(1) : "0.0";

	// boot sequence — auto start on mount (simulation only)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			pushLine("", "", "$ laracloud up", "", "req");
			pushLine("", "", "· resolving php-wasm @ 8.4.12");
			setBootMeta("downloading php-wasm… 6.2 MB");
			// progress bar 0 -> 1 over 1400ms
			const t0 = performance.now();
			await new Promise<void>((res) => {
				const tick = (t: number) => {
					if (cancelled) return res();
					const p = Math.min(1, (t - t0) / 1400);
					const e = 1 - Math.pow(1 - p, 2);
					setBootProgress(e);
					if (p < 1) requestAnimationFrame(tick);
					else res();
				};
				requestAnimationFrame(tick);
			});
			if (cancelled) return;
			await sleep(160);
			setBootMeta("instantiating zend vm…");
			pushLine("", "", "· instantiating zend vm ............ 38 ms");
			await sleep(260);
			markReady([0, 1]);
			pushLine("", "", "· mounting /var/www/laravel ........ ok");
			await sleep(200);
			markReady([2]);
			pushLine("", "", "· loading sqlite3-wasi ............. 780 KB");
			await sleep(220);
			pushLine(
				"",
				"",
				"· migrating ........................ 4 migrations · 12 rows seeded",
			);
			await sleep(240);
			markReady([5]);
			pushLine("", "", "· registering routes ............... 38 routes");
			await sleep(200);
			markReady([3, 4]);
			pushLine(
				"",
				"",
				"✓ runtime ready — http://localhost:8080 · 214 ms",
				"",
				"ok",
			);
			setBootMeta("runtime ready — 214 ms");
			setBootProgress(1);
			setRespMeta("runtime ready — fire a request");
			bootedRef.current = true;
			setBooted(true);
			await sleep(600);
			if (!cancelled) runRequest("/");
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const nav = useCallback(
		(path: string) => {
			if (!bootedRef.current || busyRef.current) return;
			runRequest(path);
		},
		[runRequest],
	);

	return (
		<div
			style={{ background: tokens.bg, color: tokens.text, paddingBottom: 40 }}
		>
			<div style={{ width: "min(1200px,calc(100% - 48px))", margin: "0 auto" }}>
				<div
					id="runtime"
					style={{ marginTop: 84, position: "relative", scrollMarginTop: 90 }}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontFamily: tokens.mono,
							fontSize: 10.5,
							letterSpacing: ".14em",
							textTransform: "uppercase",
							color: tokens.faint,
							marginBottom: 12,
							gap: 16,
							flexWrap: "wrap",
						}}
					>
						<span>figure 01 — runtime cross-section</span>
						<span
							style={{
								display: "flex",
								gap: 18,
								alignItems: "center",
								letterSpacing: ".1em",
							}}
						>
							<span>
								<i
									style={{
										display: "inline-block",
										width: 7,
										height: 7,
										borderRadius: "50%",
										marginRight: 7,
										verticalAlign: 1,
										background: tokens.green,
									}}
								/>
								ready
							</span>
							<span>
								<i
									style={{
										display: "inline-block",
										width: 7,
										height: 7,
										borderRadius: "50%",
										marginRight: 7,
										verticalAlign: 1,
										background: tokens.accent,
									}}
								/>
								executing
							</span>
							<span>≈ 1200× slow motion</span>
						</span>
					</div>

					<div
						style={{
							border: `1px solid ${tokens.line}`,
							borderRadius: 12,
							background: tokens.panel,
							overflow: "hidden",
						}}
					>
						{/* head */}
						<div
							style={{
								height: 46,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "0 16px",
								borderBottom: `1px solid ${tokens.line}`,
								fontFamily: tokens.mono,
								fontSize: 11,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<span
									style={{
										width: 7,
										height: 7,
										borderRadius: "50%",
										background: booted
											? tokens.green
											: busy
												? tokens.accent
												: tokens.dim,
										transition: "background .3s",
									}}
								/>
								laracloud runtime
								<span style={{ color: tokens.dim, marginLeft: 2 }}>v1.4.2</span>
							</div>
							<div
								className="hidden sm:flex"
								style={{ color: tokens.faint, gap: 18 }}
							>
								<span>
									php 8.4.12 · wasm32-wasi ·{" "}
									<b style={{ color: tokens.muted, fontWeight: 500 }}>
										42 MB RSS
									</b>
								</span>
								<b style={{ color: tokens.muted, fontWeight: 500 }}>
									req {String(reqN).padStart(3, "0")}
									{reqN > 0 ? ` · avg ${avgMs} ms` : ""}
								</b>
							</div>
						</div>

						{/* body */}
						<div
							className="grid grid-cols-1 lg:grid-cols-[1.28fr_1fr]"
							style={{ minHeight: 540 }}
						>
							<div
								style={{
									position: "relative",
									padding: "14px 8px",
									borderRight: `1px solid ${tokens.line}`,
									userSelect: "none",
								}}
								className="lg:border-r border-b lg:border-b-0"
							>
								<span
									style={{
										position: "absolute",
										width: 11,
										height: 11,
										top: 9,
										left: 9,
										borderTop: `1px solid ${tokens.line2}`,
										borderLeft: `1px solid ${tokens.line2}`,
									}}
								/>
								<span
									style={{
										position: "absolute",
										width: 11,
										height: 11,
										top: 9,
										right: 9,
										borderTop: `1px solid ${tokens.line2}`,
										borderRight: `1px solid ${tokens.line2}`,
									}}
								/>
								<span
									style={{
										position: "absolute",
										width: 11,
										height: 11,
										bottom: 9,
										left: 9,
										borderBottom: `1px solid ${tokens.line2}`,
										borderLeft: `1px solid ${tokens.line2}`,
									}}
								/>
								<span
									style={{
										position: "absolute",
										width: 11,
										height: 11,
										bottom: 9,
										right: 9,
										borderBottom: `1px solid ${tokens.line2}`,
										borderRight: `1px solid ${tokens.line2}`,
									}}
								/>
								<StackDiagram
									activeLayers={activeLayers}
									readyLayers={readyLayers}
									packetY={packetY}
									packetVisible={packetVisible}
									packetLabel={packetLabel}
									packetOk={packetOk}
									blinking={
										!window.matchMedia?.("(prefers-reduced-motion: reduce)")
											.matches
									}
								/>
							</div>

							<div
								style={{
									display: "flex",
									flexDirection: "column",
									minWidth: 0,
								}}
							>
								<BrowserViewport
									addr={addr}
									setAddr={setAddr}
									onSubmit={() => nav(addr)}
									onReload={() => nav(lastPathRef.current)}
									ready={booted}
									busy={busy}
									view={view}
									painting={painting}
									respMeta={respMeta}
									respOk={respOk}
									bootProgress={bootProgress}
									bootMeta={bootMeta}
									booted={booted}
								/>
								<ConsolePanel lines={lines} />
							</div>
						</div>

						<RoutesBar busy={busy} activeRoute={activeRoute} onNav={nav} />
					</div>
				</div>
			</div>
		</div>
	);
}
