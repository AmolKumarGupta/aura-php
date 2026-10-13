import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import type { PHP } from "@php-wasm/universal";

export interface LaravelBootStats {
	zipBytes: number;
	downloadMs: number;
	fileCount: number;
	totalBytes: number;
	extractMs: number;
	migrationCount: number;
	sqliteBytes: number;
}

export default function useLaravel() {
	const [laravelBooted, setBooted] = useState(false);
	const [laravelBootProgress, setBootProgress] = useState(0);
	const [laravelBootStatus, setBootStatus] = useState("Loading laravel app");
	const [stats, setStats] = useState<LaravelBootStats | null>(null);
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
				const tDownload0 = performance.now();
				const res = await fetch("/laravel.zip");
				if (!res.ok) throw new Error(`laravel.zip: HTTP ${res.status}`);
				const zipData = await res.arrayBuffer();
				const downloadMs = performance.now() - tDownload0;
				const zipBytes = zipData.byteLength;
				const zip = await JSZip.loadAsync(zipData);
				setBootProgress(0.25);

				const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
				// Real count straight from the bundle that ships
				// apps/laravel-app — no hardcoded migration number.
				const migrationCount = entries.filter(([p]) =>
					p.startsWith("database/migrations/"),
				).length;
				let sqliteBytes = 0;
				for (const [p, f] of entries) {
					if (p === "database/database.sqlite") {
						// uncompressedSize is available without inflating.
						const u = (
							f as unknown as {
								_data?: { uncompressedSize?: unknown };
							}
						)._data?.uncompressedSize;
						sqliteBytes = typeof u === "number" && u > 0 ? u : sqliteBytes;
					}
				}
				// Fall back to the sqlite entry size if the internal field
				// wasn't populated (different jszip versions).
				if (sqliteBytes === 0) {
					const sqliteEntry = entries.find(
						([p]) => p === "database/database.sqlite",
					);
					if (sqliteEntry) {
						try {
							const buf = await sqliteEntry[1].async("uint8array");
							sqliteBytes = buf.byteLength;
						} catch {
							// leave 0 — the log line will omit sqlite size
						}
					}
				}
				// Read blobs in parallel (async-parallel), then write sequentially
				// since mkdir/writeFile share VFS state.
				const blobs = await Promise.all(
					entries.map(async ([path, file]) => ({
						path,
						content: await file.async("uint8array"),
					})),
				);
				const total = blobs.length;
				let totalBytes = 0;
				for (const b of blobs) totalBytes += b.content.byteLength;
				const tExtract0 = performance.now();
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
				const extractMs = performance.now() - tExtract0;

				setStats({
					zipBytes,
					downloadMs,
					fileCount: total,
					totalBytes,
					extractMs,
					migrationCount,
					sqliteBytes,
				});
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
		stats,
	};
}
