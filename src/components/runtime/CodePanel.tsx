import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { FileCode2, FileText } from "lucide-react";
import type { PHP } from "@php-wasm/universal";
import { cn } from "@/lib/utils";

type FileEntry = {
	path: string;
	folder: string;
	label: string;
	php: boolean;
};

const FILES: FileEntry[] = [
	{
		path: "routes/web.php",
		folder: "routes",
		label: "web.php",
		php: true,
	},
	{
		path: "app/Models/User.php",
		folder: "app/Models",
		label: "User.php",
		php: true,
	},
	{
		path: "database/migrations/0001_01_01_000000_create_users_table.php",
		folder: "database/migrations",
		label: "create_users_table.php",
		php: true,
	},
	{
		path: ".env.example",
		folder: "laravel-app",
		label: ".env.example",
		php: false,
	},
];

export default function CodePanel({
	php,
	filesReady,
}: {
	php: PHP | null;
	filesReady: boolean;
}) {
	const [active, setActive] = useState(FILES[0].path);
	const [docs, setDocs] = useState<Record<string, string> | null>(null);
	const activeFile = FILES.find((f) => f.path === active) ?? FILES[0];
	const folders = [...new Set(FILES.map((f) => f.folder))];

	useEffect(() => {
		if (!php || !filesReady) return;
		let cancelled = false;
		(async () => {
			await Promise.resolve();
			const next: Record<string, string> = {};
			for (const f of FILES) {
				try {
					next[f.path] = php.readFileAsText(`/app/${f.path}`);
				} catch {
					next[f.path] = "(could not load file)";
				}
			}
			if (!cancelled) setDocs(next);
		})();
		return () => {
			cancelled = true;
		};
	}, [php, filesReady]);

	const onEdit = (v: string) => {
		setDocs((prev) => (prev ? { ...prev, [activeFile.path]: v } : prev));
		try {
			php?.writeFile(`/app/${activeFile.path}`, v);
		} catch {
			// keep the local edit when the save fails
		}
	};

	return (
		<div className="flex min-h-[320px] flex-col border-b border-border lg:col-span-2 xl:col-span-1 xl:min-h-[540px] xl:border-r xl:border-b-0">
			<div className="flex h-[34px] shrink-0 items-center justify-between border-b border-border px-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
				<span>files</span>
				<span>laravel-app</span>
			</div>

			<div className="flex min-h-0 flex-1">
				<div className="w-[150px] shrink-0 overflow-y-auto border-r border-border py-1.5">
					{folders.map((folder) => (
						<div key={folder}>
							<div className="truncate px-3 pt-1.5 font-mono text-[9px] tracking-[0.1em] text-muted-foreground/70 uppercase">
								{folder}
							</div>
							{FILES.filter((f) => f.folder === folder).map((f) => {
								const Icon = f.php ? FileCode2 : FileText;
								return (
									<button
										key={f.path}
										onClick={() => setActive(f.path)}
										className={cn(
											"flex w-full items-center gap-1.5 truncate px-3 py-1 text-left font-mono text-[11px] transition",
											f.path === active
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										<Icon className="size-3.5 shrink-0" />
										<span className="truncate">{f.label}</span>
									</button>
								);
							})}
						</div>
					))}
				</div>

				<div className="flex min-w-0 flex-1 flex-col">
					<div className="shrink-0 truncate border-b border-border px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground">
						{activeFile.path}
					</div>
					<div className="min-h-0 flex-1 overflow-hidden">
						{docs ? (
							<CodeMirror
								value={docs[activeFile.path]}
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
								loading files…
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="shrink-0 border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
				Edits save to the app files in this tab.
			</div>
		</div>
	);
}
