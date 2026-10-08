import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { PHP } from "@php-wasm/universal";
import { php as phpLang } from "@codemirror/lang-php";
import FileTree, { type DirEntry } from "./FileTree";

// Heavy editor — split out of the initial bundle (bundle-dynamic-imports).
const CodeMirror = lazy(() => import("@uiw/react-codemirror"));

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
	let text: string;
	try {
		text = php.readFileAsText(vfsPath);
	} catch {
		return "(could not load file)";
	}
	if (text.length > MAX_PREVIEW_CHARS) {
		return `${text.slice(0, MAX_PREVIEW_CHARS)}\n\n… (truncated, file too large to preview)`;
	}
	// Crude binary guard: lots of NULs means not text.
	let nul = 0;
	const scan = Math.min(text.length, 8000);
	for (let i = 0; i < scan; i += 1) {
		if (text.charCodeAt(i) === 0) nul += 1;
		if (nul > 10) return "(binary file — preview not supported)";
	}
	return text;
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
	// Refs mirror async state so callbacks stay stable (rerender-dependencies):
	// FileTree won't re-render just because `docs` gained a keystroke.
	// Synced in effects — never written during render (react-hooks/refs).
	const phpRef = useRef<PHP | null>(null);
	const childrenRef = useRef(childrenMap);
	const docsRef = useRef(docs);
	useEffect(() => {
		phpRef.current = php;
	}, [php]);
	useEffect(() => {
		childrenRef.current = childrenMap;
	}, [childrenMap]);
	useEffect(() => {
		docsRef.current = docs;
	}, [docs]);

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
			if (docsRef.current[DEFAULT_FILE] === undefined) {
				const text = readPreview(php, `/app/${DEFAULT_FILE}`);
				setDocs((prev) =>
					prev[DEFAULT_FILE] !== undefined
						? prev
						: { ...prev, [DEFAULT_FILE]: text },
				);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [php, filesReady]);

	const handleToggle = useCallback((vfsDir: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(vfsDir)) next.delete(vfsDir);
			else next.add(vfsDir);
			return next;
		});
		// Lazy-load children on first expand (keeps vendor/ cheap until opened).
		if (!childrenRef.current[vfsDir]) {
			const instance = phpRef.current;
			if (!instance) return;
			setLoadingDirs((prev) => new Set(prev).add(vfsDir));
			// listFiles/isDir are sync; defer one tick so the chevron animates first.
			setTimeout(() => {
				try {
					const entries = listDirEntries(instance, vfsDir);
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
	}, []);

	const handleSelect = useCallback((relPath: string) => {
		setActive(relPath);
		if (docsRef.current[relPath] === undefined) {
			const instance = phpRef.current;
			if (!instance) return;
			const text = readPreview(instance, `/app/${relPath}`);
			setDocs((prev) =>
				prev[relPath] !== undefined ? prev : { ...prev, [relPath]: text },
			);
		}
	}, []);

	const onEdit = useCallback((v: string) => {
		setActive((current) => {
			if (!current) return current;
			const key = current;
			setDocs((prev) => ({ ...prev, [key]: v }));
			try {
				phpRef.current?.writeFile(`/app/${key}`, v);
			} catch {
				// keep the local edit when the save fails
			}
			return current;
		});
	}, []);

	const activeContent = active ? docs[active] : undefined;

	// PHP highlighting for *.php (incl. Blade). `phpLang()` treats content
	// outside `<?...?>` as HTML, so mixed templates still parse.
	// Non-PHP files get no language extension (plain text).
	const extensions = useMemo(
		() => (active?.endsWith(".php") ? [phpLang()] : []),
		[active],
	);

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
						{active ? (
							activeContent !== undefined ? (
								<Suspense
									fallback={
										<div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
											loading editor…
										</div>
									}
								>
									<CodeMirror
										key={active}
										value={activeContent}
										onChange={onEdit}
										theme="none"
										height="100%"
										extensions={extensions}
										basicSetup={{
											lineNumbers: true,
											foldGutter: false,
											autocompletion: false,
										}}
										style={{ fontSize: "12px" }}
									/>
								</Suspense>
							) : (
								<div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
									loading files…
								</div>
							)
						) : (
							<div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
								Select a file
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
