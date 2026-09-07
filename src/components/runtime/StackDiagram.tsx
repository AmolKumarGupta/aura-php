import { ENTRY_Y, GAP, LAYERS, LH, Y0, layerCenterY } from "./types";
import { tokens } from "./tokens";

interface StackDiagramProps {
	activeLayers: Set<number>;
	readyLayers: Set<number>;
	packetY: number;
	packetVisible: boolean;
	packetLabel: string;
	packetOk: boolean;
	blinking: boolean;
}

export default function StackDiagram({
	activeLayers,
	readyLayers,
	packetY,
	packetVisible,
	packetLabel,
	packetOk,
	blinking,
}: StackDiagramProps) {
	const chipWidth = 14 + packetLabel.length * 6.5;

	return (
		<>
			<style>{`@keyframes lc-blink{50%{opacity:.3}}`}</style>
			<svg
				id="stackSvg"
				viewBox="0 0 620 570"
				preserveAspectRatio="xMidYMid meet"
				aria-label="Layered runtime stack diagram"
				style={{ width: "100%", height: "100%", display: "block" }}
			>
				{/* guide */}
				<line
					x1={310}
					y1={ENTRY_Y - 6}
					x2={310}
					y2={Y0 + 5 * GAP + LH - 6}
					stroke="rgba(235,229,220,.055)"
				/>
				{/* connections */}
				{LAYERS.map((_, i) =>
					i < LAYERS.length - 1 ? (
						<line
							key={`conn-${i}`}
							x1={310}
							y1={Y0 + i * GAP + LH}
							x2={310}
							y2={Y0 + i * GAP + GAP}
							stroke="rgba(235,229,220,.13)"
							strokeDasharray="2 4"
						/>
					) : null,
				)}
				{/* entry label */}
				<text
					x={296}
					y={ENTRY_Y + 3}
					textAnchor="end"
					style={{
						fontFamily: tokens.mono,
						fontSize: 9.5,
						fill: "#6E6960",
						letterSpacing: ".16em",
					}}
				>
					fetch()
				</text>
				<circle cx={310} cy={ENTRY_Y} r={3} fill="#4a453c" />

				{/* layers */}
				{LAYERS.map((L, i) => {
					const y = Y0 + i * GAP;
					const isOn = activeLayers.has(i);
					const isReady = readyLayers.has(i);
					const ledFill = isOn
						? tokens.accent
						: isReady
							? tokens.green
							: "#39352D";
					return (
						<g key={L.name}>
							<rect
								x={14}
								y={y}
								width={592}
								height={LH}
								rx={6}
								fill={isOn ? "rgba(255,59,38,.055)" : "rgba(235,229,220,.022)"}
								stroke={isOn ? "rgba(255,59,38,.9)" : "rgba(235,229,220,.13)"}
								style={{ transition: "stroke .25s,fill .25s" }}
							/>
							<rect
								x={14}
								y={y + 9}
								width={3}
								height={LH - 18}
								fill={isOn ? tokens.accent : "transparent"}
								style={{ transition: "fill .25s" }}
							/>
							<circle
								cx={46}
								cy={y + LH / 2}
								r={3.5}
								fill={ledFill}
								style={{
									transition: "fill .3s",
									animation:
										isOn && blinking ? "lc-blink .9s infinite" : undefined,
								}}
							/>
							<text
								x={66}
								y={y + 27}
								style={{
									fontFamily: tokens.mono,
									fontSize: 12,
									fontWeight: 600,
									letterSpacing: ".15em",
									fill: isOn ? tokens.text : "#8F887C",
									transition: "fill .25s",
								}}
							>
								{L.name}
							</text>
							<text
								x={66}
								y={y + 47}
								style={{
									fontFamily: tokens.mono,
									fontSize: 10,
									fill: "#6E6960",
								}}
							>
								{L.desc}
							</text>
							<text
								x={592}
								y={y + 27}
								textAnchor="end"
								style={{
									fontFamily: tokens.mono,
									fontSize: 9,
									fill: "#57534B",
									letterSpacing: ".1em",
								}}
							>
								{String(i + 1).padStart(2, "0")}
							</text>
							<text
								x={592}
								y={y + 47}
								textAnchor="end"
								style={{
									fontFamily: tokens.mono,
									fontSize: 10.5,
									fill: isOn ? tokens.accent : "#8F887C",
									transition: "fill .25s",
								}}
							>
								{L.size}
							</text>
						</g>
					);
				})}

				{/* packet */}
				<g
					opacity={packetVisible ? 1 : 0}
					transform={`translate(0 ${packetY - ENTRY_Y})`}
				>
					<circle cx={310} cy={ENTRY_Y} r={4.5} fill={tokens.accent} />
					{packetLabel ? (
						<>
							<rect
								x={322}
								y={ENTRY_Y - 29}
								height={18}
								rx={4}
								width={chipWidth}
								fill="#171310"
								stroke={
									packetOk ? "rgba(62,207,142,.65)" : "rgba(255,59,38,.6)"
								}
							/>
							<text
								x={330}
								y={ENTRY_Y - 16}
								style={{
									fontFamily: tokens.mono,
									fontSize: 9.5,
									fill: tokens.text,
									letterSpacing: ".05em",
								}}
							>
								{packetLabel}
							</text>
						</>
					) : null}
				</g>

				{/* layer center markers (invisible, for reference) */}
				{LAYERS.map((_, i) => (
					<title
						key={`lc-${i}`}
					>{`layer ${i} center ${layerCenterY(i)}`}</title>
				))}
			</svg>
		</>
	);
}
