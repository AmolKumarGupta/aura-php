import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { PHP } from "@php-wasm/universal";
import FileTree, { type DirEntry } from "./FileTree";

const DEFAULT_FILE = "main.php";
const PRELOAD_DIRS = ["/app/app", "/app/app/Models", "/app/routes"];
const MAX_PREVIEW_CHARS = 200_000;

function listDirEntries(php: PHP, vfsDir: string): DirEntry[] {
	let names: string[];
	try {
		names = php.listFiles(vfsDir);
	} catch {
		return [];
	}
	const out: DirEntry[] = [];
	for (const name of names) {
		if (name === "." || name === ".." || name === "") continue;
		const full = `${vfsDir}/${name}`;
		let isDir: boolean;
		try {
			isDir = php.isDir(full);
		} catch {
			isDir = false;
		}
		out.push({ name, isDir });
	}
	return out;
}

function readPreview(php: PHP, vfsPath: string): string {
	try {
		const text = php.readFileAsText(vfsPath);
		if (text.length > MAX_PREVIEW_CHARS) {
			return `${text.slice(0, MAX_PREVIEW_CHARS)}\n\n… (truncated, file too large to preview)`;
		}
		// crude binary guard: lots of NULs means not text
		let nul = 0;
		for (let i = 0; i < Math.min(text.length, 8000); i += 1) {
			if (text.charCodeAt(i) === 0) nul += 1;
		}
		if (nul > 10) return "(binary file — preview not supported)";
		return text;
	} catch {
		return "(could not load file)";
	}
}

export default function CodePanel({
	php,
	filesReady,
}: {
	php: PHP | null;
	filesReady: boolean;
}) {
	const [childrenMap, setChildrenMap] = useState<Record<string, DirEntry[]>>(
		{},
	);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());
	const [active, setActive] = useState<string | null>(DEFAULT_FILE);
	const [docs, setDocs] = useState<Record<string, string>>({});
	const [treeReady, setTreeReady] = useState(false);

	// Initial tree load: top-level + preloaded dirs so the default file is visible.
	useEffect(() => {
		if (!php || !filesReady) return;
		let cancelled = false;
		(async () => {
			await Promise.resolve();
			if (cancelled) return;
			const nextMap: Record<string, DirEntry[]> = {};
			nextMap["/app"] = listDirEntries(php, "/app");
			const nextExpanded = new Set<string>();
			for (const dir of PRELOAD_DIRS) {
				try {
					if (php.fileExists(dir) && php.isDir(dir)) {
						nextMap[dir] = listDirEntries(php, dir);
						nextExpanded.add(dir);
					}
				} catch {
					// skip dirs that can't be read (e.g. missing in zip)
				}
			}
			if (cancelled) return;
			setChildrenMap(nextMap);
			setExpanded(nextExpanded);
			setTreeReady(true);
			setDocs((prev) =>
				prev[DEFAULT_FILE] !== undefined
					? prev
					: {
							...prev,
							[DEFAULT_FILE]: readPreview(php, `/app/${DEFAULT_FILE}`),
						},
			);
		})();
		return () => {
			cancelled = true;
		};
	}, [php, filesReady]);

	const handleToggle = useCallback(
		(vfsDir: string) => {
			setExpanded((prev) => {
				const next = new Set(prev);
				if (next.has(vfsDir)) {
					next.delete(vfsDir);
				} else {
					next.add(vfsDir);
				}
				return next;
			});
			// Lazy-load children on first expand (keeps vendor/ cheap until opened).
			if (!childrenMap[vfsDir] && php) {
				setLoadingDirs((prev) => new Set(prev).add(vfsDir));
				// listFiles/isDir are sync; defer one tick so the chevron animates first.
				setTimeout(() => {
					try {
						const entries = listDirEntries(php, vfsDir);
						setChildrenMap((prev) => ({ ...prev, [vfsDir]: entries }));
					} finally {
						setLoadingDirs((prev) => {
							const next = new Set(prev);
							next.delete(vfsDir);
							return next;
						});
					}
				}, 0);
			}
		},
		[childrenMap, php],
	);

	const handleSelect = useCallback(
		(relPath: string) => {
			setActive(relPath);
			if (php && docs[relPath] === undefined) {
				const text = readPreview(php, `/app/${relPath}`);
				setDocs((prev) => ({ ...prev, [relPath]: text }));
			}
		},
		[php, docs],
	);

	const onEdit = (v: string) => {
		if (!active) return;
		setDocs((prev) => ({ ...prev, [active]: v }));
		try {
			php?.writeFile(`/app/${active}`, v);
		} catch {
			// keep the local edit when the save fails
		}
	};

	const activeContent = active ? docs[active] : undefined;

	return (
		<div className="flex min-h-[320px] flex-col border-b border-border lg:col-span-2 xl:col-span-1 xl:min-h-[540px] xl:border-r xl:border-b-0">
			<div className="flex h-[34px] shrink-0 items-center justify-between border-b border-border px-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
				<span>files</span>
				<span>laravel-app</span>
			</div>

			<div className="flex min-h-0 flex-1">
				<div className="w-[200px] shrink-0 overflow-y-auto border-r border-border py-1.5">
					{treeReady ? (
						<FileTree
							childrenMap={childrenMap}
							expanded={expanded}
							loadingDirs={loadingDirs}
							activeFile={active}
							onToggle={handleToggle}
							onSelect={handleSelect}
						/>
					) : (
						<div className="px-3 py-8 text-center font-mono text-[11px] text-muted-foreground">
							{filesReady ? "loading files…" : "Waiting for boot..."}
						</div>
					)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col">
					<div className="shrink-0 truncate border-b border-border px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground">
						{active ?? "Select a file"}
					</div>
					<div className="min-h-0 flex-1 overflow-hidden">
						{active && activeContent !== undefined ? (
							<CodeMirror
								key={active}
								value={activeContent}
								onChange={onEdit}
								theme="none"
								height="100%"
								basicSetup={{
									lineNumbers: true,
									foldGutter: false,
									autocompletion: false,
								}}
								style={{ fontSize: "12px" }}
							/>
						) : (
							<div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
								{active ? "loading files…" : "Select a file"}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="shrink-0 border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
				Edits save to the app files in this tab. Run always executes main.php.
			</div>
		</div>
	);
}
