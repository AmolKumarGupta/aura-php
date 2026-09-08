import { cn } from "@/lib/utils";
import { ENTRY_Y, GAP, LAYERS, LH, Y0, layerCenterY } from "./types";

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
		<svg
			id="stackSvg"
			viewBox="0 0 620 570"
			preserveAspectRatio="xMidYMid meet"
			aria-label="Layered runtime stack diagram"
			className="block h-full w-full"
		>
			{/* guide */}
			<line
				x1={310}
				y1={ENTRY_Y - 6}
				x2={310}
				y2={Y0 + 5 * GAP + LH - 6}
				className="stroke-border/60"
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
						className="stroke-border [stroke-dasharray:2_4]"
					/>
				) : null,
			)}
			{/* entry label */}
			<text
				x={296}
				y={ENTRY_Y + 3}
				textAnchor="end"
				className="fill-muted-foreground font-mono text-[9.5px] tracking-[0.16em]"
			>
				fetch()
			</text>
			<circle
				cx={310}
				cy={ENTRY_Y}
				r={3}
				className="fill-muted-foreground/40"
			/>

			{/* layers */}
			{LAYERS.map((L, i) => {
				const y = Y0 + i * GAP;
				const isOn = activeLayers.has(i);
				const isReady = readyLayers.has(i);
				return (
					<g key={L.name}>
						<rect
							x={14}
							y={y}
							width={592}
							height={LH}
							rx={6}
							className={cn(
								"transition-colors duration-300",
								isOn
									? "fill-primary/10 stroke-primary/90"
									: "fill-muted/30 stroke-border",
							)}
						/>
						<rect
							x={14}
							y={y + 9}
							width={3}
							height={LH - 18}
							className={cn(
								"transition-colors duration-300",
								isOn ? "fill-primary" : "fill-transparent",
							)}
						/>
						<circle
							cx={46}
							cy={y + LH / 2}
							r={3.5}
							className={cn(
								"transition-colors duration-300",
								isOn
									? "fill-primary"
									: isReady
										? "fill-chart-3"
										: "fill-muted-foreground/30",
								isOn && blinking && "animate-pulse",
							)}
						/>
						<text
							x={66}
							y={y + 27}
							className={cn(
								"font-mono text-xs font-semibold tracking-[0.15em] transition-colors duration-300",
								isOn ? "fill-foreground" : "fill-muted-foreground",
							)}
						>
							{L.name}
						</text>
						<text
							x={66}
							y={y + 47}
							className="fill-muted-foreground font-mono text-[10px]"
						>
							{L.desc}
						</text>
						<text
							x={592}
							y={y + 27}
							textAnchor="end"
							className="fill-muted-foreground/70 font-mono text-[9px] tracking-[0.1em]"
						>
							{String(i + 1).padStart(2, "0")}
						</text>
						<text
							x={592}
							y={y + 47}
							textAnchor="end"
							className={cn(
								"font-mono text-[10.5px] transition-colors duration-300",
								isOn ? "fill-primary" : "fill-muted-foreground",
							)}
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
				<circle cx={310} cy={ENTRY_Y} r={4.5} className="fill-primary" />
				{packetLabel ? (
					<>
						<rect
							x={322}
							y={ENTRY_Y - 29}
							height={18}
							rx={4}
							width={chipWidth}
							className={cn(
								"fill-card transition-colors duration-200",
								packetOk ? "stroke-chart-3/70" : "stroke-primary/60",
							)}
						/>
						<text
							x={330}
							y={ENTRY_Y - 16}
							className="fill-foreground font-mono text-[9.5px] tracking-[0.05em]"
						>
							{packetLabel}
						</text>
					</>
				) : null}
			</g>

			{/* layer center markers (invisible, for reference) */}
			{LAYERS.map((_, i) => (
				<title key={`lc-${i}`}>{`layer ${i} center ${layerCenterY(i)}`}</title>
			))}
		</svg>
	);
}
