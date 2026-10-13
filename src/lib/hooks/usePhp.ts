import { useEffect, useState } from "react";
import { PHP, loadPHPRuntime } from "@php-wasm/universal";
import { getPHPLoaderModule } from "@php-wasm/web-8-4";

export interface PhpBootStats {
	loaderMs: number;
	runtimeMs: number;
	vmMs: number;
	versionMs: number;
	totalMs: number;
	phpVersion: string;
}

export function usePhp() {
	const [php, setPhp] = useState<PHP | null>(null);
	const [booted, setBooted] = useState(false);
	const [bootProgress, setBootProgress] = useState(0);
	const [bootStatus, setBootStatus] = useState("Loading PHP runtime...");
	const [stats, setStats] = useState<PhpBootStats | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function initialize() {
			const t0 = performance.now();
			try {
				setBootStatus("Loading PHP 8.4...");
				setBootProgress(0);
				const tLoader0 = performance.now();
				const loaderModule = await getPHPLoaderModule();
				const loaderMs = performance.now() - tLoader0;

				setBootProgress(0.05);
				const tRuntime0 = performance.now();
				const runtimeId = await loadPHPRuntime(loaderModule);
				const runtimeMs = performance.now() - tRuntime0;

				if (cancelled) {
					return;
				}
				setBootProgress(0.1);
				const tVm0 = performance.now();
				const phpInstance = new PHP(runtimeId);
				const vmMs = performance.now() - tVm0;
				if (!cancelled) {
					setPhp(phpInstance);
				}

				// Real version probe inside the WASM interpreter — not a
				// hardcoded string. Falls back to the bundled major only.
				let phpVersion = "8.4";
				let versionMs = 0;
				try {
					const tVer0 = performance.now();
					const resp = await phpInstance.run({
						code: `<?php echo phpversion();`,
					});
					versionMs = performance.now() - tVer0;
					const v = resp.text.trim();
					if (v) phpVersion = v;
				} catch {
					// keep fallback — boot still succeeds
				}

				if (!cancelled) {
					setStats({
						loaderMs,
						runtimeMs,
						vmMs,
						versionMs,
						totalMs: performance.now() - t0,
						phpVersion,
					});
					setBootStatus("Ready");
					setBootProgress(1);
					setBooted(true);
				}
			} catch (error) {
				if (!cancelled) {
					setBootStatus(
						`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			}
		}

		initialize();

		return () => {
			cancelled = true;
		};
	}, []);

	return {
		php,
		booted,
		bootProgress,
		bootStatus,
		stats,
	};
}
