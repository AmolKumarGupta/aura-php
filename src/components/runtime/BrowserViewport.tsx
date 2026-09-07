import { useEffect, useRef } from "react";
import { RotateCw } from "lucide-react";
import { tokens } from "./tokens";
import type { ConsoleLine } from "./types";

export function BrowserViewport({
	addr,
	setAddr,
	onSubmit,
	onReload,
	ready,
	busy,
	view,
	painting,
	respMeta,
	respOk,
	bootProgress,
	bootMeta,
	booted,
}: {
	addr: string;
	setAddr: (v: string) => void;
	onSubmit: () => void;
	onReload: () => void;
	ready: boolean;
	busy: boolean;
	view: "boot" | "welcome" | "e404";
	painting: boolean;
	respMeta: string;
	respOk: boolean | null;
	bootProgress: number;
	bootMeta: string;
	booted: boolean;
}) {
	const addrRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			const ae = document.activeElement as HTMLElement | null;
			if (e.key === "/" && ae && !/INPUT|TEXTAREA/.test(ae.tagName)) {
				e.preventDefault();
				addrRef.current?.focus();
				addrRef.current?.select();
			}
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	return (
		<div style={{ borderBottom: `1px solid ${tokens.line}` }}>
			<div
				style={{
					height: 42,
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "0 12px",
					borderBottom: `1px solid ${tokens.line}`,
				}}
			>
				<button
					onClick={onReload}
					title="re-run request"
					aria-label="re-run request"
					style={{
						width: 26,
						height: 26,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: `1px solid ${tokens.line}`,
						borderRadius: 6,
						color: tokens.muted,
						opacity: busy ? 0.4 : 1,
						pointerEvents: busy ? "none" : "auto",
						background: "none",
					}}
				>
					<RotateCw size={13} />
				</button>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
					style={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						background: "#0B0908",
						border: `1px solid ${tokens.line}`,
						borderRadius: 6,
						height: 28,
						padding: "0 10px",
						fontFamily: tokens.mono,
						fontSize: 11,
						minWidth: 0,
					}}
				>
					<span style={{ color: tokens.dim }}>http://</span>
					<input
						ref={addrRef}
						value={addr}
						onChange={(e) => setAddr(e.target.value)}
						spellCheck={false}
						autoComplete="off"
						aria-label="address bar"
						style={{
							flex: 1,
							minWidth: 0,
							background: "transparent",
							border: 0,
							outline: 0,
							color: tokens.text,
							fontFamily: tokens.mono,
							fontSize: 11,
						}}
					/>
				</form>
				<span
					style={{
						width: 7,
						height: 7,
						borderRadius: "50%",
						flex: "0 0 auto",
						background: ready
							? tokens.green
							: busy
								? tokens.accent
								: tokens.dim,
						transition: "background .3s",
					}}
				/>
			</div>

			<div
				style={{
					height: 252,
					background: "#F5F1EA",
					color: "#1B1815",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						height: "100%",
						overflowY: "auto",
						transition: "opacity .16s,transform .16s",
						opacity: painting ? 0 : 1,
						transform: painting ? "translateY(6px)" : "none",
					}}
				>
					{view === "boot" && !booted ? (
						<div
							style={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								padding: "0 24px",
								fontFamily: tokens.mono,
							}}
						>
							<div
								style={{
									fontSize: 13,
									letterSpacing: ".22em",
									fontWeight: 600,
								}}
							>
								MYAPP
							</div>
							<div
								style={{
									fontSize: 9.5,
									color: "#8a8378",
									margin: "5px 0 12px",
									letterSpacing: ".05em",
								}}
							>
								laracloud · booting runtime
							</div>
							<div
								style={{
									height: 4,
									background: "rgba(27,24,21,.13)",
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										height: "100%",
										width: `${Math.round(bootProgress * 100)}%`,
										background: "#FF2D20",
									}}
								/>
							</div>
							<div
								style={{
									marginTop: 9,
									fontSize: 9,
									color: "#8a8378",
									letterSpacing: ".04em",
								}}
							>
								{bootMeta}
							</div>
						</div>
					) : view === "e404" ? (
						<div style={{ padding: "14px 16px 16px", fontSize: 11 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: 10,
									borderBottom: "1px solid rgba(27,24,21,.14)",
									paddingBottom: 8,
									marginBottom: 12,
									fontFamily: tokens.mono,
									fontSize: 9.5,
									letterSpacing: ".05em",
								}}
							>
								<b style={{ fontSize: 10, letterSpacing: ".14em" }}>MYAPP</b>
								<span style={{ color: "#8a8378" }}>
									{addr
										.replace(/^https?:\/\//, "")
										.replace(/^localhost:8080/, "") || "/"}
								</span>
								<span
									style={{
										color: "#F5F1EA",
										background: "#1B1815",
										padding: "1px 6px",
										borderRadius: 3,
										fontSize: 8.5,
									}}
								>
									local
								</span>
							</div>
							<div style={{ paddingTop: 14 }}>
								<b
									style={{
										fontFamily: tokens.serif,
										fontWeight: 400,
										fontSize: 44,
										lineHeight: 1,
										color: "#FF2D20",
										display: "block",
									}}
								>
									404
								</b>
								<span
									style={{
										display: "block",
										fontFamily: tokens.mono,
										fontSize: 10,
										marginTop: 6,
									}}
								>
									NotFoundHttpException
								</span>
								<i
									style={{
										display: "block",
										fontStyle: "normal",
										fontFamily: tokens.mono,
										fontSize: 9,
										color: "#8a8378",
										marginTop: 4,
									}}
								>
									no route matched — Router.php:1287
								</i>
							</div>
						</div>
					) : (
						<div style={{ padding: "14px 16px 16px", fontSize: 11 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: 10,
									borderBottom: "1px solid rgba(27,24,21,.14)",
									paddingBottom: 8,
									marginBottom: 12,
									fontFamily: tokens.mono,
									fontSize: 9.5,
									letterSpacing: ".05em",
								}}
							>
								<b style={{ fontSize: 10, letterSpacing: ".14em" }}>MYAPP</b>
								<span style={{ color: "#8a8378" }}>/</span>
								<span
									style={{
										color: "#F5F1EA",
										background: "#1B1815",
										padding: "1px 6px",
										borderRadius: 3,
										fontSize: 8.5,
									}}
								>
									local
								</span>
							</div>
							<div>
								<h4
									style={{
										fontFamily: tokens.serif,
										fontWeight: 400,
										fontSize: 23,
										margin: "2px 0 6px",
									}}
								>
									Laravel runs here.
								</h4>
								<p
									style={{
										color: "#6b655b",
										marginTop: 0,
										lineHeight: 1.6,
										fontSize: 10.5,
									}}
								>
									Rendered inside this tab by PHP&nbsp;8.4 — no server involved.
								</p>
							</div>
							<div
								style={{
									marginTop: 14,
									borderTop: "1px solid rgba(27,24,21,.14)",
								}}
							>
								{[
									["APP_NAME", "MyApp"],
									["PHP_VERSION", "8.4.12 (wasm32-wasi)"],
									["LARAVEL", "12.9.0"],
									["DB_CONNECTION", "sqlite · ::memory:"],
								].map(([k, v]) => (
									<div
										key={k}
										style={{
											display: "flex",
											justifyContent: "space-between",
											gap: 10,
											padding: "6px 0",
											borderBottom: "1px solid rgba(27,24,21,.09)",
											fontFamily: tokens.mono,
											fontSize: 9.5,
										}}
									>
										<span style={{ color: "#8a8378" }}>{k}</span>
										<b style={{ fontWeight: 500, textAlign: "right" }}>{v}</b>
									</div>
								))}
							</div>
							<div
								style={{
									marginTop: 11,
									color: "#a09a8e",
									fontFamily: tokens.mono,
									fontSize: 9,
									letterSpacing: ".04em",
								}}
							>
								booted in 214 ms · artifact 8.9 MB · zero network hops
							</div>
						</div>
					)}
				</div>
			</div>

			<div
				style={{
					fontFamily: tokens.mono,
					fontSize: 10,
					color: tokens.muted,
					padding: "8px 12px",
					borderTop: `1px solid ${tokens.line}`,
				}}
			>
				{respOk === null ? (
					respMeta
				) : (
					<>
						<b
							style={{
								color: respOk ? tokens.green : tokens.err,
								fontWeight: 500,
							}}
						>
							{respMeta.split("·")[0]}
						</b>
						<span> ·{respMeta.split("·").slice(1).join("·")}</span>
					</>
				)}
			</div>
		</div>
	);
}

export function ConsolePanel({ lines }: { lines: ConsoleLine[] }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines.length]);

	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				minHeight: 210,
			}}
		>
			<div
				style={{
					height: 34,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "0 12px",
					fontFamily: tokens.mono,
					fontSize: 10,
					letterSpacing: ".14em",
					textTransform: "uppercase",
					color: tokens.faint,
					borderBottom: `1px solid ${tokens.line}`,
				}}
			>
				<span>console</span>
				<span>laravel.log — live</span>
			</div>
			<div
				ref={ref}
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "10px 12px",
					fontFamily: tokens.mono,
					fontSize: 11,
					lineHeight: 1.75,
				}}
			>
				{lines.map((l) => (
					<div
						key={l.id}
						style={{ display: "flex", gap: 11, alignItems: "baseline" }}
					>
						<span style={{ color: "#57534B", flex: "0 0 auto" }}>{l.t}</span>
						<span style={{ color: "#8F887C", flex: "0 0 auto" }}>{l.comp}</span>
						<span
							style={{
								flex: 1,
								minWidth: 0,
								wordBreak: "break-word",
								color:
									l.cls === "req" || l.cls === "ok"
										? tokens.text
										: l.cls === "err"
											? tokens.err
											: "#C9C2B6",
							}}
						>
							{l.msg}
						</span>
						{l.ms ? (
							<span
								style={{
									color: l.cls === "err" ? tokens.err : tokens.green,
									flex: "0 0 auto",
								}}
							>
								{l.ms}
							</span>
						) : null}
					</div>
				))}
			</div>
		</div>
	);
}

export function RoutesBar({
	busy,
	activeRoute,
	onNav,
}: {
	busy: boolean;
	activeRoute: string;
	onNav: (path: string) => void;
}) {
	return (
		<div
			style={{
				borderTop: `1px solid ${tokens.line}`,
				padding: "10px 16px",
				display: "flex",
				alignItems: "center",
				gap: 8,
				flexWrap: "wrap",
				opacity: busy ? 0.85 : 1,
			}}
		>
			<span
				style={{
					fontFamily: tokens.mono,
					fontSize: 10,
					letterSpacing: ".16em",
					textTransform: "uppercase",
					color: tokens.dim,
					marginRight: 6,
				}}
			>
				routes
			</span>
			<button
				onClick={() => onNav("/")}
				style={{
					fontFamily: tokens.mono,
					fontSize: 11,
					color: activeRoute === "/" ? tokens.accent : tokens.muted,
					border: `1px solid ${activeRoute === "/" ? "rgba(255,59,38,.55)" : tokens.line}`,
					borderRadius: 6,
					padding: "6px 12px",
					background: activeRoute === "/" ? "rgba(255,59,38,.07)" : "none",
					opacity: busy ? 0.4 : 1,
					pointerEvents: busy ? "none" : "auto",
				}}
			>
				/
			</button>
			<span
				className="hidden md:inline"
				style={{
					marginLeft: "auto",
					fontFamily: tokens.mono,
					fontSize: 10,
					color: tokens.dim,
				}}
			>
				press{" "}
				<kbd
					style={{
						fontFamily: tokens.mono,
						fontSize: 10,
						border: `1px solid ${tokens.line2}`,
						borderBottomWidth: 2,
						borderRadius: 4,
						padding: "1px 5px",
						color: tokens.muted,
					}}
				>
					/
				</kbd>{" "}
				and type any path — the router is real
			</span>
		</div>
	);
}
