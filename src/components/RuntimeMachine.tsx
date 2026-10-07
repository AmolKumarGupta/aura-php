import { useCallback, useEffect, useRef, useState } from "react";
import type { PHP } from "@php-wasm/universal";
import { cn } from "@/lib/utils";
import type { ConsoleLine } from "./runtime/types";
import CodePanel from "./runtime/CodePanel";
import {
	BrowserViewport,
	ConsolePanel,
	type PreviewView,
} from "./runtime/BrowserViewport";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Wrapper bootstraps Laravel (same pattern as the original App.tsx demo)
// so main.php runs with facades, Eloquent, views, etc. available.
const RUNNER_PATH = "/run-main.php";
const RUNNER_CODE = `<?php
chdir('/app');
require_once '/app/vendor/autoload.php';
$__auraApp = require_once '/app/bootstrap/app.php';
$__auraKernel = $__auraApp->make(Illuminate\\Contracts\\Console\\Kernel::class);
$__auraKernel->bootstrap();
require '/app/main.php';`;

const MAX_CONSOLE_LINES = 200;
const MAX_OUTPUT_BYTES = 200_000;

let lineId = 0;
let runSeq = 0;

function kbOf(s: string): string {
	const bytes = new TextEncoder().encode(s).length;
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}

// HTML output (e.g. `<script>`, `<pre>`, error pages) is rendered in the
// preview pane via setOutput — mirroring it to the console would duplicate it.
function looksLikeHtml(s: string): boolean {
	return /^\s*<(?:!doctype|html|head|body|div|span|p|h\d|pre|script|style|table|svg)\b/i.test(
		s,
	);
}

export default function RuntimeMachine({
	php,
	filesReady,
}: {
	php: PHP | null;
	filesReady: boolean;
}) {
	const [busy, setBusy] = useState(false);
	const [booted, setBooted] = useState(false);
	const [lines, setLines] = useState<ConsoleLine[]>([]);
	const [view, setView] = useState<PreviewView>("boot");
	const [painting, setPainting] = useState(false);
	const [output, setOutput] = useState<string | null>(null);
	const [errorText, setErrorText] = useState<string | null>(null);
	const [respMeta, setRespMeta] = useState("runtime offline — booting…");
	const [respOk, setRespOk] = useState<boolean | null>(null);
	const [bootProgress, setBootProgress] = useState(0);
	const [bootMeta, setBootMeta] = useState("resolving php-wasm…");
	const [reqN, setReqN] = useState(0);
	const [reqSum, setReqSum] = useState(0);
	const wallRef = useRef(0);
	const busyRef = useRef(false);
	const bootedRef = useRef(false);
	const phpRef = useRef<PHP | null>(null);
	const filesReadyRef = useRef(filesReady);
	useEffect(() => {
		phpRef.current = php;
	}, [php]);
	useEffect(() => {
		filesReadyRef.current = filesReady;
	}, [filesReady]);

	const fmtT = () => `+${(wallRef.current / 1000).toFixed(4)}`;

	const pushLine = useCallback(
		(t: string, comp: string, msg: string, ms = "", cls = "") => {
			lineId += 1;
			const id = lineId;
			setLines((prev) => [...prev, { id, t, comp, msg, ms, cls }]);
		},
		[],
	);

	const pushMirrored = useCallback(
		(text: string, cls: "" | "ok" | "err") => {
			const chunks = text.split("\n");
			const capped =
				chunks.length > MAX_CONSOLE_LINES
					? [
							...chunks.slice(0, MAX_CONSOLE_LINES),
							`… (truncated, +${chunks.length - MAX_CONSOLE_LINES} more lines)`,
						]
					: chunks;
			for (const chunk of capped) {
				if (chunk === "" && cls === "") continue;
				pushLine(fmtT(), "php", chunk === "" ? "(empty line)" : chunk, "", cls);
			}
		},
		[pushLine],
	);

	const runMain = useCallback(async () => {
		const instance = phpRef.current;
		if (busyRef.current || !bootedRef.current || !instance) return;
		if (!filesReadyRef.current) {
			pushLine(
				fmtT(),
				"php",
				"app files still extracting — try again…",
				"",
				"err",
			);
			return;
		}
		busyRef.current = true;
		setBusy(true);
		runSeq += 1;
		const n = runSeq;
		const t0 = performance.now();
		pushLine(
			fmtT(),
			"php",
			`$ php /app/main.php  # run ${String(n).padStart(3, "0")}`,
			"",
			"req",
		);
		setRespMeta("executing main.php…");
		setRespOk(null);
		setErrorText(null);
		try {
			instance.writeFile(RUNNER_PATH, RUNNER_CODE);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "could not stage runner";
			pushLine(fmtT(), "php", msg, "", "err");
			setRespMeta("500 runner error · could not stage /run-main.php");
			setRespOk(false);
			busyRef.current = false;
			setBusy(false);
			return;
		}
		try {
			const resp = await instance.runStream({ scriptPath: RUNNER_PATH });
			const [stdout, stderr, exitCode] = await Promise.all([
				resp.stdoutText,
				resp.stderrText,
				resp.exitCode,
			]);
			const ms = performance.now() - t0;
			wallRef.current += ms;
			const ok = exitCode === 0;
			const trimmed =
				stdout.length > MAX_OUTPUT_BYTES
					? `${stdout.slice(0, MAX_OUTPUT_BYTES)}\n<!-- truncated -->`
					: stdout;
			if (stdout && !looksLikeHtml(stdout))
				pushMirrored(stdout, ok ? "" : "err");
			if (stderr && !looksLikeHtml(stderr)) pushMirrored(stderr, "err");
			pushLine(
				fmtT(),
				"php",
				`◂ exit ${exitCode} · ${kbOf(stdout)} stdout${stderr ? ` · ${kbOf(stderr)} stderr` : ""}`,
				`${ms.toFixed(1)} ms`,
				ok ? "ok" : "err",
			);
			setPainting(true);
			window.setTimeout(() => {
				setOutput(trimmed.length > 0 ? trimmed : null);
				setErrorText(
					!ok && !trimmed ? stderr || `exit ${exitCode}` : stderr || null,
				);
				setView("output");
				setPainting(false);
			}, 150);
			setRespMeta(
				ok
					? `200 OK · text/html · ${kbOf(stdout)} · ${ms.toFixed(1)} ms · from main.php`
					: `${exitCode === 0 ? 200 : 500} PHP error · ${kbOf(stderr || stdout)} · ${ms.toFixed(1)} ms · from main.php`,
			);
			setRespOk(ok);
			setReqN((prev) => prev + 1);
			setReqSum((s) => s + ms);
		} catch (e) {
			const ms = performance.now() - t0;
			const msg = e instanceof Error ? e.message : "unknown execution failure";
			pushLine(fmtT(), "php", msg, `${ms.toFixed(1)} ms`, "err");
			setErrorText(msg);
			setView("output");
			setRespMeta(`500 PHP error · ${ms.toFixed(1)} ms · from main.php`);
			setRespOk(false);
		} finally {
			busyRef.current = false;
			setBusy(false);
		}
	}, [pushLine, pushMirrored]);

	// derived average — computed during render, no effect needed
	const avgMs = reqN > 0 ? (reqSum / reqN).toFixed(1) : "0.0";
	const canRun = booted && filesReady && php !== null && !busy;

	// boot sequence — log lines only; real readiness comes from usePhp/useLaravel
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
			pushLine("", "", "· mounting /var/www/laravel ........ ok");
			await sleep(200);
			pushLine("", "", "· loading sqlite3-wasi ............. 780 KB");
			await sleep(220);
			pushLine(
				"",
				"",
				"· migrating ........................ 4 migrations · 12 rows seeded",
			);
			await sleep(240);
			pushLine("", "", "· registering routes ............... 38 routes");
			await sleep(200);
			pushLine("", "", "✓ runtime ready — press Run main.php", "", "ok");
			setBootMeta("runtime ready — press Run");
			setBootProgress(1);
			setRespMeta("runtime ready — press Run to execute main.php");
			bootedRef.current = true;
			setBooted(true);
			setView("idle");
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
									run {String(reqN).padStart(3, "0")}
									{reqN > 0 ? ` · avg ${avgMs} ms` : ""}
								</b>
							</div>
						</div>

						{/* body */}
						<div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[2fr_1fr]">
							<CodePanel php={php} filesReady={filesReady} />

							<div className="flex min-w-0 flex-col">
								<BrowserViewport
									onRun={runMain}
									canRun={canRun}
									ready={booted}
									busy={busy}
									view={view}
									painting={painting}
									output={output}
									errorText={errorText}
									respMeta={respMeta}
									respOk={respOk}
									bootProgress={bootProgress}
									bootMeta={bootMeta}
									booted={booted}
								/>
								<ConsolePanel lines={lines} />
							</div>
						</div>

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
					</div>
				</div>
			</div>
		</div>
	);
}
