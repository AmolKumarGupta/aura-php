import { ChevronRight, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

export type DirEntry = {
	name: string;
	isDir: boolean;
};

type FileTreeProps = {
	childrenMap: Record<string, DirEntry[]>;
	expanded: Set<string>;
	loadingDirs: Set<string>;
	activeFile: string | null;
	depth?: number;
	parentPath?: string;
	parentRel?: string;
	onToggle: (vfsDir: string) => void;
	onSelect: (relPath: string) => void;
};

function sortedEntries(entries: DirEntry[]): DirEntry[] {
	const dirs = entries
		.filter((e) => e.isDir)
		.sort((a, b) => a.name.localeCompare(b.name));
	const files = entries
		.filter((e) => !e.isDir)
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...dirs, ...files];
}

export default function FileTree({
	childrenMap,
	expanded,
	loadingDirs,
	activeFile,
	depth = 0,
	parentPath = "/app",
	parentRel = "",
	onToggle,
	onSelect,
}: FileTreeProps) {
	const entries = sortedEntries(childrenMap[parentPath] ?? []);

	return (
		<div>
			{entries.map((entry) => {
				const vfsPath = `${parentPath}/${entry.name}`;
				const relPath = parentRel ? `${parentRel}/${entry.name}` : entry.name;

				if (entry.isDir) {
					const open = expanded.has(vfsPath);
					const loading = loadingDirs.has(vfsPath);
					return (
						<div key={vfsPath}>
							<button
								type="button"
								onClick={() => onToggle(vfsPath)}
								className="flex w-full cursor-pointer items-center gap-1.5 truncate px-3 py-[3px] text-left transition select-none hover:bg-muted/60"
								style={{ paddingLeft: `${12 + depth * 12}px` }}
							>
								<ChevronRight
									className={cn(
										"size-3 shrink-0 text-muted-foreground transition-transform duration-150",
										open && "rotate-90",
									)}
								/>
								<Folder className="size-4 shrink-0 text-muted-foreground" />
								<span className="truncate font-mono text-[12px] text-foreground/80">
									{entry.name}
								</span>
							</button>
							{open ? (
								loading ? (
									<div
										className="truncate px-3 py-0.5 font-mono text-[11px] text-muted-foreground/60"
										style={{ paddingLeft: `${12 + (depth + 1) * 12}px` }}
									>
										loading…
									</div>
								) : (
									<FileTree
										childrenMap={childrenMap}
										expanded={expanded}
										loadingDirs={loadingDirs}
										activeFile={activeFile}
										depth={depth + 1}
										parentPath={vfsPath}
										parentRel={relPath}
										onToggle={onToggle}
										onSelect={onSelect}
									/>
								)
							) : null}
						</div>
					);
				}

				const isActive = activeFile === relPath;
				return (
					<button
						key={vfsPath}
						type="button"
						onClick={() => onSelect(relPath)}
						className={cn(
							"flex w-full cursor-pointer items-center gap-1.5 truncate px-3 py-[3px] text-left transition select-none",
							isActive
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
						)}
						style={{ paddingLeft: `${12 + depth * 12}px` }}
					>
						<span className="w-3 shrink-0" />
						<File className="size-4 shrink-0 opacity-70" />
						<span className="truncate font-mono text-[12px]">{entry.name}</span>
					</button>
				);
			})}
		</div>
	);
}
