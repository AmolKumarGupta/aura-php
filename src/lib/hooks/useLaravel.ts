import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import type { PHP } from "@php-wasm/universal";

export default function useLaravel() {
	const [laravelBooted, setBooted] = useState(false);
	const [laravelBootProgress, setBootProgress] = useState(0);
	const [laravelBootStatus, setBootStatus] = useState("Loading laravel app");
	// Init-once guard: StrictMode double-invokes effects, and App's boot
	// effect may re-fire — never extract the zip twice (advanced-init-once).
	const bootingRef = useRef(false);
	const doneRef = useRef(false);

	const ensureDir = useCallback((php: PHP, vfsPath: string) => {
		const parts = vfsPath.split("/").slice(1, -1);
		let dir = "";
		for (const part of parts) {
			dir += `/${part}`;
			if (!php.fileExists(dir)) php.mkdir(dir);
		}
	}, []);

	const bootLaravel = useCallback(
		async (php: PHP) => {
			if (doneRef.current || bootingRef.current) return;
			bootingRef.current = true;
			try {
				const res = await fetch("/laravel.zip");
				if (!res.ok) throw new Error(`laravel.zip: HTTP ${res.status}`);
				const zipData = await res.arrayBuffer();
				const zip = await JSZip.loadAsync(zipData);
				setBootProgress(0.25);

				const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
				// Read blobs in parallel (async-parallel), then write sequentially
				// since mkdir/writeFile share VFS state.
				const blobs = await Promise.all(
					entries.map(async ([path, file]) => ({
						path,
						content: await file.async("uint8array"),
					})),
				);
				const total = blobs.length;
				for (let i = 0; i < blobs.length; i += 1) {
					const { path, content } = blobs[i];
					const vfsPath = `/app/${path}`;
					ensureDir(php, vfsPath);
					php.writeFile(vfsPath, content);
					// Throttle progress updates — one setState per file re-renders
					// hundreds of times on large zips (rerender-transitions).
					if ((i + 1) % 25 === 0 || i + 1 === total) {
						setBootStatus(`Extracting files ${i + 1}/${total}`);
						setBootProgress(0.25 + (0.75 * (i + 1)) / total);
					}
				}

				setBootProgress(1);
				setBootStatus("Laravel app ready");
				doneRef.current = true;
				setBooted(true);
			} catch (e) {
				setBootStatus(
					`Laravel boot failed: ${e instanceof Error ? e.message : "unknown error"}`,
				);
				throw e;
			} finally {
				bootingRef.current = false;
			}
		},
		[ensureDir],
	);

	return {
		bootLaravel,
		laravelBooted,
		laravelBootStatus,
		laravelBootProgress,
	};
}
