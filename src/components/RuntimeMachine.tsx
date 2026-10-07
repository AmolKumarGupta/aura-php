import { memo, useEffect } from "react";
import type { PHP } from "@php-wasm/universal";
import { cn } from "@/lib/utils";
import CodePanel from "./runtime/CodePanel";
import { BrowserViewport, ConsolePanel } from "./runtime/BrowserViewport";
import { useConsoleLog } from "./runtime/useConsoleLog";
import { useBootSimulation } from "./runtime/useBootSimulation";
import { useRunMain } from "./runtime/useRunMain";

// Static header legend — hoisted outside the component (rendering-hoist-jsx)
// so it isn't re-created on every console line.
function FigureLegend({ reqN, avgMs }: { reqN: number; avgMs: string }) {
	return (
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
				<span className="hidden sm:inline">
					run {String(reqN).padStart(3, "0")}
					{reqN > 0 ? ` · avg ${avgMs} ms` : ""}
				</span>
			</span>
		</div>
	);
}

const RuntimeHead = memo(function RuntimeHead({
	booted,
	busy,
}: {
	booted: boolean;
	busy: boolean;
}) {
	return (
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
				<span>php 8.4.12 · wasm32-wasi · 42 MB RSS</span>
			</div>
		</div>
	);
});

const EntrypointFooter = memo(function EntrypointFooter() {
	return (
		<div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
			<span className="mr-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
				entrypoint
			</span>
			<span className="rounded-md border border-primary/60 bg-primary/10 px-3 py-1.5 font-mono text-[11px] text-primary">
				/app/main.php
			</span>
			<span className="ml-auto hidden font-mono text-[10px] text-muted-foreground md:inline">
				press{" "}
				<kbd className="rounded border border-b-2 border-border px-[5px] py-px font-mono text-[10px] text-muted-foreground">
					ctrl+enter
				</kbd>{" "}
				to run — output is always main.php
			</span>
		</div>
	);
});

// Memoized so parent console-line updates don't re-render the editor
// (rerender-memo) — CodePanel only depends on php + filesReady.
const MemoCodePanel = memo(CodePanel);

export default function RuntimeMachine({
	php,
	filesReady,
}: {
	php: PHP | null;
	filesReady: boolean;
}) {
	const log = useConsoleLog();
	const boot = useBootSimulation(log);
	const run = useRunMain(log);

	const { setPhpInstance, setFilesReady, markBootReady } = run;
	useEffect(() => {
		setPhpInstance(php);
	}, [php, setPhpInstance]);
	useEffect(() => {
		setFilesReady(filesReady);
	}, [filesReady, setFilesReady]);

	// Flip the preview from boot → idle once the fake boot finishes.
	// Derived from `boot.booted`, no extra state (rerender-derived-state-no-effect).
	useEffect(() => {
		if (boot.booted) markBootReady();
	}, [boot.booted, markBootReady]);

	// Derived averages — computed during render, no effect needed.
	const avgMs = run.reqN > 0 ? (run.reqSum / run.reqN).toFixed(1) : "0.0";
	const canRun = boot.booted && filesReady && php !== null && !run.busy;

	return (
		<div className="bg-background pb-10 text-foreground">
			<div className="mx-auto w-[min(1200px,calc(100%-48px))]">
				<div id="runtime" className="relative mt-[84px] scroll-mt-[90px]">
					<FigureLegend reqN={run.reqN} avgMs={avgMs} />

					<div className="overflow-hidden rounded-xl border border-border bg-card">
						<RuntimeHead booted={boot.booted} busy={run.busy} />

						<div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[2fr_1fr]">
							<MemoCodePanel php={php} filesReady={filesReady} />

							<div className="flex min-w-0 flex-col">
								<BrowserViewport
									onRun={run.runMain}
									canRun={canRun}
									ready={boot.booted}
									busy={run.busy}
									view={run.view}
									painting={run.painting}
									output={run.output}
									errorText={run.errorText}
									respMeta={run.respMeta}
									respOk={run.respOk}
									bootProgress={boot.bootProgress}
									bootMeta={boot.bootMeta}
									booted={boot.booted}
								/>
								<ConsolePanel lines={log.lines} />
							</div>
						</div>

						<EntrypointFooter />
					</div>
				</div>
			</div>
		</div>
	);
}
