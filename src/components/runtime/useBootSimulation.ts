import { useEffect, useRef, useState } from "react";
import type { LaravelBootStats } from "@/lib/hooks/useLaravel";
import type { PhpBootStats } from "@/lib/hooks/usePhp";
import type { ConsoleLog } from "./useConsoleLog";

// The ONLY static boot line — everything else is measured at runtime.
const DB_MIGRATED_LINE = "· database migrated";

function fmtMs(ms: number): string {
	return ms < 10 ? `${ms.toFixed(1)} ms` : `${Math.round(ms)} ms`;
}

function fmtBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export interface BootInput {
	phpReady: boolean;
	phpStats: PhpBootStats | null;
	phpProgress: number;
	filesReady: boolean;
	laravelStats: LaravelBootStats | null;
	laravelProgress: number;
	laravelStatus: string;
}

/**
 * Real boot logger — every number comes from measured runtime telemetry
 * (php-wasm timings, laravel.zip download/extract, VFS counts). No fake
 * sleeps or hardcoded ms/KB/route figures. The single exception is the
 * static "database migrated" line.
 */
export function useBootSimulation(
	log: Pick<ConsoleLog, "pushLine">,
	input: BootInput,
) {
	const [booted, setBooted] = useState(false);
	const {
		phpReady,
		phpStats,
		phpProgress,
		filesReady,
		laravelStats,
		laravelProgress,
		laravelStatus,
	} = input;
	const { pushLine } = log;
	const upLoggedRef = useRef(false);
	const phpLoggedRef = useRef(false);
	const laravelLoggedRef = useRef(false);

	// `$ aura up` once on mount (ref guard keeps StrictMode remounts clean).
	useEffect(() => {
		if (upLoggedRef.current) return;
		upLoggedRef.current = true;
		pushLine("", "", "$ aura up", "", "req");
	}, [pushLine]);

	// Real PHP telemetry — logged as soon as the version probe resolves.
	useEffect(() => {
		if (!phpStats || phpLoggedRef.current) return;
		phpLoggedRef.current = true;
		pushLine(
			"",
			"",
			`· php ${phpStats.phpVersion} — loader ${fmtMs(phpStats.loaderMs)} · runtime ${fmtMs(phpStats.runtimeMs)} · vm ${fmtMs(phpStats.vmMs)}`,
			fmtMs(phpStats.totalMs),
		);
	}, [phpStats, pushLine]);

	// Real Laravel bundle telemetry + the one static line.
	useEffect(() => {
		if (!filesReady || !laravelStats || laravelLoggedRef.current) return;
		laravelLoggedRef.current = true;
		pushLine(
			"",
			"",
			`· laravel.zip ${fmtBytes(laravelStats.zipBytes)} — ${laravelStats.fileCount} files`,
			fmtMs(laravelStats.downloadMs),
		);
		pushLine(
			"",
			"",
			`· extracted ${laravelStats.fileCount} files (${fmtBytes(laravelStats.totalBytes)}) → /app`,
			fmtMs(laravelStats.extractMs),
		);
		pushLine("", "", DB_MIGRATED_LINE);
		const tail =
			laravelStats.sqliteBytes > 0
				? ` · sqlite ${fmtBytes(laravelStats.sqliteBytes)}`
				: "";
		pushLine("", "", `· migrations ${laravelStats.migrationCount}${tail}`);
		pushLine("", "", "✓ runtime ready — press Run main.php", "", "ok");
		setBooted(true);
	}, [filesReady, laravelStats, pushLine]);

	// Real progress — weighted from the actual loaders, no fake animation.
	const bootProgress = phpReady
		? 0.15 + laravelProgress * 0.85
		: Math.max(0, Math.min(1, phpProgress)) * 0.15;
	const bootMeta = !phpReady
		? "loading php…"
		: !filesReady
			? laravelStatus || "extracting laravel app…"
			: "runtime ready — press Run";

	return { booted, bootProgress, bootMeta };
}
