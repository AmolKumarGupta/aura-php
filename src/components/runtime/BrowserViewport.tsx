import { memo, useEffect, useMemo } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleLine, PreviewView } from "./types";

export type { PreviewView };

/** Ctrl/Cmd+Enter to run. Single global listener, cleaned up on unmount. */
function useRunShortcut(onRun: () => void) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				onRun();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onRun]);
}

type RunBarProps = {
	onRun: () => void;
	canRun: boolean;
	busy: boolean;
	ready: boolean;
};

const RunBar = memo(function RunBar({
	onRun,
	canRun,
	busy,
	ready,
}: RunBarProps) {
	return (
		<div className="flex h-[42px] items-center gap-2.5 border-b border-border px-3">
			<button
				onClick={onRun}
				disabled={!canRun}
				title="Run main.php (Ctrl+Enter)"
				aria-label="Run main.php"
				className={cn(
					"flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 font-mono text-[11px] font-medium transition",
					canRun
						? "bg-primary text-primary-foreground hover:opacity-90"
						: "pointer-events-none bg-muted text-muted-foreground opacity-60",
				)}
			>
				<Play size={13} className={cn(busy && "animate-pulse")} />
				{busy ? "Running…" : "Run main.php"}
			</button>
			<span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
				/app/main.php
			</span>
			<span
				className={cn(
					"size-[7px] shrink-0 rounded-full transition-colors duration-300",
					ready
						? "bg-chart-3"
						: busy
							? "animate-pulse bg-primary"
							: "bg-muted-foreground/40",
				)}
			/>
		</div>
	);
});

type PreviewPaneProps = {
	view: PreviewView;
	booted: boolean;
	bootProgress: number;
	bootMeta: string;
	painting: boolean;
	output: string | null;
	errorText: string | null;
};

const PreviewPane = memo(function PreviewPane({
	view,
	booted,
	bootProgress,
	bootMeta,
	painting,
	output,
	errorText,
}: PreviewPaneProps) {
	// Ternary-only branches (rendering-conditional-render): no `&&` inside JSX.
	const body =
		view === "boot" ? (
			!booted ? (
				<div className="flex h-full flex-col justify-center px-6 font-mono">
					<div className="text-[13px] font-semibold tracking-[0.22em]">
						MYAPP
					</div>
					<div className="my-[5px] mb-3 text-[9.5px] tracking-[0.05em] text-muted-foreground">
						aura · booting runtime
					</div>
					<div className="h-1 overflow-hidden rounded-sm bg-muted">
						<div
							className="h-full bg-primary"
							style={{ width: `${Math.round(bootProgress * 100)}%` }}
						/>
					</div>
					<div className="mt-[9px] text-[9px] tracking-[0.04em] text-muted-foreground">
						{bootMeta}
					</div>
				</div>
			) : null
		) : view === "idle" ? (
			<div className="flex h-full flex-col items-start justify-center px-6 font-mono">
				<div className="text-[13px] font-semibold tracking-[0.22em]">
					MAIN.PHP
				</div>
				<div className="my-[5px] mb-3 max-w-[300px] text-[10px] leading-relaxed tracking-[0.02em] text-muted-foreground">
					Runtime ready. Press Run to execute{" "}
					<span className="text-foreground">/app/main.php</span> — its stdout
					renders here as HTML.
				</div>
				<div className="text-[9px] tracking-[0.04em] text-muted-foreground/70">
					ctrl / cmd + enter to run
				</div>
			</div>
		) : errorText && !output ? (
			<pre className="h-full overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-destructive">
				{errorText}
			</pre>
		) : output ? (
			<iframe
				title="main.php output"
				sandbox=""
				srcDoc={output}
				className="h-full w-full border-0 bg-white"
			/>
		) : (
			<div className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
				(no output — main.php echoed nothing)
			</div>
		);

	return (
		<div className="h-[252px] overflow-hidden bg-background text-foreground">
			<div
				className={cn(
					"h-full overflow-y-auto transition-[opacity,transform] duration-150",
					painting && "translate-y-1.5 opacity-0",
				)}
			>
				{body}
			</div>
		</div>
	);
});

const RespMetaLine = memo(function RespMetaLine({
	respMeta,
	respOk,
}: {
	respMeta: string;
	respOk: boolean | null;
}) {
	// Cache the split so we don't parse twice per render (js-cache-function-results).
	const [head, tail] = useMemo(() => {
		const parts = respMeta.split("·");
		return [parts[0], parts.slice(1).join("·")] as const;
	}, [respMeta]);

	return (
		<div className="border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
			{respOk === null ? (
				respMeta
			) : (
				<>
					<b
						className={cn(
							"font-medium",
							respOk ? "text-chart-3" : "text-destructive",
						)}
					>
						{head}
					</b>
					<span> ·{tail}</span>
				</>
			)}
		</div>
	);
});

export const BrowserViewport = memo(function BrowserViewport({
	onRun,
	canRun,
	ready,
	busy,
	view,
	painting,
	output,
	errorText,
	respMeta,
	respOk,
	bootProgress,
	bootMeta,
	booted,
}: {
	onRun: () => void;
	canRun: boolean;
	ready: boolean;
	busy: boolean;
	view: PreviewView;
	painting: boolean;
	output: string | null;
	errorText: string | null;
	respMeta: string;
	respOk: boolean | null;
	bootProgress: number;
	bootMeta: string;
	booted: boolean;
}) {
	useRunShortcut(onRun);

	return (
		<div className="border-b border-border">
			<RunBar onRun={onRun} canRun={canRun} busy={busy} ready={ready} />
			<PreviewPane
				view={view}
				booted={booted}
				bootProgress={bootProgress}
				bootMeta={bootMeta}
				painting={painting}
				output={output}
				errorText={errorText}
			/>
			<RespMetaLine respMeta={respMeta} respOk={respOk} />
		</div>
	);
});

export const ConsolePanel = memo(function ConsolePanel({
	lines,
}: {
	lines: ConsoleLine[];
}) {
	useEffect(() => {
		// Auto-scroll is an effect on length only — no layout read per line.
		const el = document.getElementById("aura-console-scroll");
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines.length]);

	return (
		<div className="flex min-h-[210px] flex-1 flex-col">
			<div className="flex h-[34px] items-center justify-between border-b border-border px-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
				<span>console</span>
				<span>laravel.log — live</span>
			</div>
			<div
				id="aura-console-scroll"
				className="flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-[1.75]"
			>
				{lines.map((l) => (
					<div key={l.id} className="flex items-baseline gap-[11px]">
						<span className="shrink-0 text-muted-foreground/60">{l.t}</span>
						<span className="shrink-0 text-muted-foreground">{l.comp}</span>
						<span
							className={cn(
								"min-w-0 flex-1 break-words whitespace-pre-wrap",
								l.cls === "req" || l.cls === "ok"
									? "text-foreground"
									: l.cls === "err"
										? "text-destructive"
										: "text-muted-foreground",
							)}
						>
							{l.msg}
						</span>
						{l.ms ? (
							<span
								className={cn(
									"shrink-0",
									l.cls === "err" ? "text-destructive" : "text-chart-3",
								)}
							>
								{l.ms}
							</span>
						) : null}
					</div>
				))}
			</div>
		</div>
	);
});
