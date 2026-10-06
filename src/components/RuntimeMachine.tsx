import { useCallback, useEffect, useRef, useState } from "react";
import type { PHP } from "@php-wasm/universal";
import { cn } from "@/lib/utils";
import { ENTRY_Y, layerCenterY } from "./runtime/types";
import type { ConsoleLine, RouteStep } from "./runtime/types";
import CodePanel from "./runtime/CodePanel";
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
	const s = (v || "")
		.trim()
		.replace(/^https?:\/\//, "")
		.replace(/^localhost:8080/, "");
	return s === "" || s === "/" ? "/" : s.startsWith("/") ? s : `/${s}`;
}

let lineId = 0;

export default function RuntimeMachine({
	php,
	filesReady,
}: {
	php: PHP | null;
	filesReady: boolean;
}) {
	const [busy, setBusy] = useState(false);
	const [booted, setBooted] = useState(false);
	const [, setActiveLayers] = useState<Set<number>>(new Set());
	const [, setReadyLayers] = useState<Set<number>>(new Set());
	const [, setPacketY] = useState(ENTRY_Y);
	const [, setPacketVisible] = useState(false);
	const [, setPacketLabel] = useState("");
	const [, setPacketOk] = useState(false);
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
			pushLine("", "", "$ aura up", "", "req");
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
		<div className="bg-background pb-10 text-foreground">
			<div className="mx-auto w-[min(1200px,calc(100%-48px))]">
				<div id="runtime" className="relative mt-[84px] scroll-mt-[90px]">
					<div className="mb-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
						<span>figure 01 — runtime cross-section</span>
						<span className="flex items-center gap-[18px] tracking-[0.1em]">
							<span>
								<i className="mr-[7px] inline-block size-[7px] rounded-full bg-chart-3 align-[1px]" />
								ready
							</span>
							<span>
								<i className="mr-[7px] inline-block size-[7px] rounded-full bg-primary align-[1px]" />
								executing
							</span>
							<span>≈ 1200× slow motion</span>
						</span>
					</div>

					<div className="overflow-hidden rounded-xl border border-border bg-card">
						{/* head */}
						<div className="flex h-[46px] items-center justify-between border-b border-border px-4 font-mono text-[11px]">
							<div className="flex items-center gap-2.5">
								<span
									className={cn(
										"size-[7px] rounded-full transition-colors duration-300",
										booted
											? "bg-chart-3"
											: busy
												? "animate-pulse bg-primary"
												: "bg-muted-foreground/40",
									)}
								/>
								aura runtime
								<span className="ml-0.5 text-muted-foreground/70">v1.4.2</span>
							</div>
							<div className="hidden gap-[18px] text-muted-foreground sm:flex">
								<span>
									php 8.4.12 · wasm32-wasi ·{" "}
									<b className="font-medium text-muted-foreground">42 MB RSS</b>
								</span>
								<b className="font-medium text-muted-foreground">
									req {String(reqN).padStart(3, "0")}
									{reqN > 0 ? ` · avg ${avgMs} ms` : ""}
								</b>
							</div>
						</div>

						{/* body */}
						<div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[2fr_1fr]">
							<CodePanel php={php} filesReady={filesReady} />

							<div className="flex min-w-0 flex-col">
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
