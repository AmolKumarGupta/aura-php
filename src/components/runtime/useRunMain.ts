import { useCallback, useRef, useState } from "react";
import type { PHP } from "@php-wasm/universal";
import {
	RUNNER_CODE,
	RUNNER_PATH,
	kbOf,
	looksLikeHtml,
	truncateStdout,
} from "@/lib/phpRunner";
import type { ConsoleLog } from "./useConsoleLog";
import type { PreviewView } from "./types";

type RunMainDeps = Pick<
	ConsoleLog,
	"fmtT" | "pushLine" | "pushMirrored" | "wallRef"
>;

/**
 * Executes /app/main.php via a Laravel-bootstrapping runner script.
 * Owns preview output, response meta, and run counters — independent from
 * boot/file-tree state (rerender-split-combined-hooks, async-defer-await).
 */
export function useRunMain(deps: RunMainDeps) {
	const { fmtT, pushLine, pushMirrored, wallRef } = deps;
	const [output, setOutput] = useState<string | null>(null);
	const [errorText, setErrorText] = useState<string | null>(null);
	const [view, setView] = useState<PreviewView>("boot");
	const [painting, setPainting] = useState(false);
	const [respMeta, setRespMeta] = useState("runtime offline — booting…");
	const [respOk, setRespOk] = useState<boolean | null>(null);
	const [reqN, setReqN] = useState(0);
	const [reqSum, setReqSum] = useState(0);
	const [busy, setBusy] = useState(false);
	const busyRef = useRef(false);
	const runSeqRef = useRef(0);
	const phpRef = useRef<PHP | null>(null);
	const filesReadyRef = useRef(false);

	const setPhpInstance = useCallback((php: PHP | null) => {
		phpRef.current = php;
	}, []);

	const setFilesReady = useCallback((ready: boolean) => {
		filesReadyRef.current = ready;
	}, []);

	const markBootReady = useCallback(() => {
		setRespMeta("runtime ready — press Run to execute main.php");
		setView("idle");
	}, []);

	const runMain = useCallback(async () => {
		const instance = phpRef.current;
		if (busyRef.current || !instance) return;
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
		runSeqRef.current += 1;
		const n = runSeqRef.current;
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
			const trimmed = truncateStdout(stdout);
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
	}, [fmtT, pushLine, pushMirrored, wallRef]);

	return {
		runMain,
		setPhpInstance,
		setFilesReady,
		markBootReady,
		view,
		painting,
		output,
		errorText,
		respMeta,
		respOk,
		reqN,
		reqSum,
		busy,
	};
}

export type RunMain = ReturnType<typeof useRunMain>;
