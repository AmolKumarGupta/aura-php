import { useState } from "react";
import JSZip from "jszip";
import type { PHP } from "@php-wasm/universal";

export default function useLaravel() {
	const [laravelBooted, setBooted] = useState(false);
	const [laravelBootProgress, setBootProgress] = useState(0);
	const [laravelBootStatus, setBootStatus] = useState("Loading laravel app");

	async function bootLaravel(php: PHP) {
		const res = await fetch("/laravel.zip");
		const zipData = await res.arrayBuffer();

		const zip = await JSZip.loadAsync(zipData);
		setBootProgress(0.25);

		const files = Object.entries(zip.files).filter(([, f]) => !f.dir);

		let loaded = 0;
		for (const [path, file] of files) {
			const content = await file.async("uint8array");
			const vfsPath = `/app/${path}`;

			const parts = vfsPath.split("/").slice(1, -1);
			let dir = "";
			for (const part of parts) {
				dir += "/" + part;
				if (!php.fileExists(dir)) {
					php.mkdir(dir);
				}
			}

			php.writeFile(vfsPath, content);
			// initialHashes.set(path, fnv1a(content))
			loaded++;

			setBootStatus(`Extracting files ${loaded}/${files.length}`);
		}

		setBootProgress(1);
		setBooted(true);
	}

	return {
		bootLaravel,
		laravelBooted,
		laravelBootStatus,
		laravelBootProgress,
	};
}
