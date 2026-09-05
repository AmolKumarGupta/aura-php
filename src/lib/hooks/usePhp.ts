import { useEffect, useState } from "react";
import { PHP, loadPHPRuntime } from "@php-wasm/universal";
import { getPHPLoaderModule } from "@php-wasm/web-8-4";

export function usePhp() {
	const [php, setPhp] = useState<PHP | null>(null);
	const [booted, setBooted] = useState(false);
	const [bootProgress, setBootProgress] = useState(0);
	const [bootStatus, setBootStatus] = useState("Loading PHP runtime...");

	useEffect(() => {
		let cancelled = false;

		async function initialize() {
			try {
				setBootStatus("Loading PHP 8.4...");
				setBootProgress(0);
				const loaderModule = await getPHPLoaderModule();

				setBootProgress(0.05);
				const runtimeId = await loadPHPRuntime(loaderModule);

        if (cancelled) {
          return
				}
				setBootProgress(0.1);
				const phpInstance = new PHP(runtimeId);
				if (!cancelled) {
					setPhp(phpInstance);
				}

				if (!cancelled) {
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
	};
}
