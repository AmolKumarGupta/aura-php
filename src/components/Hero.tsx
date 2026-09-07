import { useRevealGroup, revealStyle } from "@/lib/hooks/useReveal";
import { tokens } from "./runtime/tokens";

export default function Hero() {
	const { visible, setRef } = useRevealGroup(4, [0, 80, 160, 220]);

	return (
		<header
			id="top"
			style={{
				position: "relative",
				padding: "158px 0 0",
				background: tokens.bg,
				color: tokens.text,
				fontFamily: tokens.sans,
				overflowX: "clip",
			}}
		>
			{/* dotted backdrop */}
			<div
				aria-hidden
				style={
					{
						content: '""',
						position: "absolute",
						inset: "0 0 auto",
						height: 640,
						backgroundImage:
							"radial-gradient(rgba(235,229,220,.13) 1px,transparent 1px)",
						backgroundSize: "26px 26px",
						opacity: 0.24,
						WebkitMaskImage: "linear-gradient(#000 0%,transparent 92%)",
						maskImage: "linear-gradient(#000 0%,transparent 92%)",
						pointerEvents: "none",
					} as React.CSSProperties
				}
			/>
			<div
				style={{
					width: "min(1200px,calc(100% - 48px))",
					margin: "0 auto",
					position: "relative",
				}}
			>
				<h1
					ref={setRef(0) as React.Ref<HTMLHeadingElement>}
					style={{
						...revealStyle(visible[0]),
						fontFamily: tokens.serif,
						fontWeight: 400,
						fontSize: "clamp(52px,7.4vw,98px)",
						lineHeight: 0.98,
						letterSpacing: "-.015em",
						position: "relative",
						margin: 0,
					}}
				>
					PHP, compiled.
					<br />
					<em style={{ fontStyle: "italic" }}>
						The server, <span style={{ color: tokens.accent }}>deleted.</span>
					</em>
				</h1>

				<p
					ref={setRef(1) as React.Ref<HTMLParagraphElement>}
					style={{
						...revealStyle(visible[1]),
						maxWidth: 580,
						color: tokens.muted,
						fontSize: 17,
						lineHeight: 1.68,
						marginTop: 30,
						position: "relative",
					}}
				>
					LaraCloud compiles the entire Laravel stack — the PHP runtime, the
					framework, your code and a SQLite volume — into one static WebAssembly
					artifact. Requests execute inside the browser tab, at memory speed.{" "}
					<strong style={{ color: tokens.text, fontWeight: 500 }}>
						Nothing leaves the machine.
					</strong>
				</p>

				<div
					ref={setRef(2) as React.Ref<HTMLDivElement>}
					style={{
						...revealStyle(visible[2]),
						display: "flex",
						gap: 14,
						marginTop: 38,
						flexWrap: "wrap",
						position: "relative",
					}}
				>
					<a
						href="#runtime"
						id="ctaLaunch"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 9,
							fontSize: 15,
							fontWeight: 600,
							padding: "14px 22px",
							borderRadius: 8,
							textDecoration: "none",
							background: tokens.accent,
							color: "#140B09",
							transition:
								"transform .2s cubic-bezier(.22,.75,.2,1),background .2s",
						}}
					>
						Launch the runtime
						<svg
							width={15}
							height={15}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M7 17 17 7M7 7h10v10" />
						</svg>
					</a>
					<a
						href="#runtime"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 9,
							fontSize: 15,
							fontWeight: 600,
							padding: "14px 22px",
							borderRadius: 8,
							textDecoration: "none",
							border: `1px solid ${tokens.line2}`,
							color: tokens.text,
							transition: "border-color .2s,background .2s",
						}}
					>
						How virtualization works
						<svg
							width={15}
							height={15}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 5v14m7-7-7 7-7-7" />
						</svg>
					</a>
				</div>

				<div
					ref={setRef(3) as React.Ref<HTMLDivElement>}
					style={{
						...revealStyle(visible[3]),
						display: "flex",
						flexWrap: "wrap",
						marginTop: 60,
						position: "relative",
						fontFamily: tokens.mono,
						fontSize: 11,
						letterSpacing: ".1em",
						textTransform: "uppercase",
						color: tokens.faint,
					}}
				>
					{[
						["runtime", "PHP 8.4.12"],
						["framework", "Laravel 12.x"],
						["storage", "SQLite 3.49"],
						["artifact", "8.9 MB"],
					].map(([k, v], i, arr) => (
						<div
							key={k}
							style={{
								padding: "6px 24px 6px 0",
								margin: "6px 24px 6px 0",
								borderRight:
									i === arr.length ? "0" : `1px solid ${tokens.line}`,
							}}
						>
							{k}
							<b style={{ color: tokens.text, fontWeight: 500, marginLeft: 7 }}>
								{v}
							</b>
						</div>
					))}
					<div style={{ padding: "6px 24px 6px 0", margin: "6px 24px 6px 0" }}>
						network hops
						<b style={{ color: tokens.accent, fontWeight: 500, marginLeft: 7 }}>
							0
						</b>
					</div>
				</div>

				<div
					className="hidden xl:block"
					style={{
						position: "absolute",
						right: -64,
						top: 340,
						writingMode: "vertical-rl",
						fontFamily: tokens.mono,
						fontSize: 10,
						letterSpacing: ".34em",
						color: tokens.dim,
						borderLeft: `1px solid ${tokens.line}`,
						paddingLeft: 14,
						textTransform: "uppercase",
					}}
				>
					wasm32-wasi · single process · zero i/o
				</div>
			</div>
		</header>
	);
}
