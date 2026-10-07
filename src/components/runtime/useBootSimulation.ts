import { useEffect, useState } from "react";
import type { ConsoleLog } from "./useConsoleLog";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const BOOT_LINES = [
	"· resolving php-wasm @ 8.4.12",
	"· instantiating zend vm ............ 38 ms",
	"· mounting /var/www/laravel ........ ok",
	"· loading sqlite3-wasi ............. 780 KB",
	"· migrating ........................ 4 migrations · 12 rows seeded",
	"· registering routes ............... 38 routes",
];

/**
 * Fake boot sequence — log lines + progress bar only. Real readiness comes
 * from usePhp/useLaravel via `markReady`. Split from RuntimeMachine so boot
 * state has independent deps (rerender-split-combined-hooks).
 */
export function useBootSimulation(log: Pick<ConsoleLog, "pushLine">) {
	const [booted, setBooted] = useState(false);
	const [bootProgress, setBootProgress] = useState(0);
	const [bootMeta, setBootMeta] = useState("resolving php-wasm…");
	const { pushLine } = log;

	useEffect(() => {
		let cancelled = false;
		(async () => {
			pushLine("", "", "$ aura up", "", "req");
			pushLine("", "", BOOT_LINES[0]);
			setBootMeta("downloading php-wasm… 6.2 MB");
			const t0 = performance.now();
			await new Promise<void>((res) => {
				const tick = (t: number) => {
					if (cancelled) return res();
					const p = Math.min(1, (t - t0) / 1400);
					setBootProgress(1 - Math.pow(1 - p, 2));
					if (p < 1) requestAnimationFrame(tick);
					else res();
				};
				requestAnimationFrame(tick);
			});
			if (cancelled) return;
			await sleep(160);
			if (cancelled) return;
			setBootMeta("instantiating zend vm…");
			for (let i = 1; i < BOOT_LINES.length; i += 1) {
				pushLine("", "", BOOT_LINES[i]);
				await sleep(i === 1 ? 260 : 210);
				if (cancelled) return;
			}
			pushLine("", "", "✓ runtime ready — press Run main.php", "", "ok");
			setBootMeta("runtime ready — press Run");
			setBootProgress(1);
			setBooted(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [pushLine]);

	return { booted, bootProgress, bootMeta };
}
