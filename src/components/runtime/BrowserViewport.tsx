import { useEffect, useRef } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleLine } from "./types";

const ENV_ROWS: [string, string][] = [
	["APP_NAME", "MyApp"],
	["PHP_VERSION", "8.4.12 (wasm32-wasi)"],
	["LARAVEL", "12.9.0"],
	["DB_CONNECTION", "sqlite · ::memory:"],
];

function ViewportNav({ path }: { path: string }) {
	return (
		<div className="mb-3 flex items-center justify-between gap-2.5 border-b border-border pb-2 font-mono text-[9.5px] tracking-[0.05em]">
			<b className="text-[10px] tracking-[0.14em]">MYAPP</b>
			<span className="text-muted-foreground">{path}</span>
			<span className="rounded bg-foreground px-1.5 py-px text-[8.5px] text-background">
				local
			</span>
		</div>
	);
}

export function BrowserViewport({
	addr,
	setAddr,
	onSubmit,
	onReload,
	ready,
	busy,
	view,
	painting,
	respMeta,
	respOk,
	bootProgress,
	bootMeta,
	booted,
}: {
	addr: string;
	setAddr: (v: string) => void;
	onSubmit: () => void;
	onReload: () => void;
	ready: boolean;
	busy: boolean;
	view: "boot" | "welcome" | "e404";
	painting: boolean;
	respMeta: string;
	respOk: boolean | null;
	bootProgress: number;
	bootMeta: string;
	booted: boolean;
}) {
	const addrRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			const ae = document.activeElement as HTMLElement | null;
			if (e.key === "/" && ae && !/INPUT|TEXTAREA/.test(ae.tagName)) {
				e.preventDefault();
				addrRef.current?.focus();
				addrRef.current?.select();
			}
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	return (
		<div className="border-b border-border">
			<div className="flex h-[42px] items-center gap-2.5 border-b border-border px-3">
				<button
					onClick={onReload}
					title="re-run request"
					aria-label="re-run request"
					className={cn(
						"flex size-[26px] shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground",
						busy && "pointer-events-none opacity-40",
					)}
				>
					<RotateCw size={13} />
				</button>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
					className="flex h-7 min-w-0 flex-1 items-center rounded-md border border-border bg-muted/40 px-2.5 font-mono text-[11px] focus-within:border-primary/50"
				>
					<span className="text-muted-foreground/60">http://</span>
					<input
						ref={addrRef}
						value={addr}
						onChange={(e) => setAddr(e.target.value)}
						spellCheck={false}
						autoComplete="off"
						aria-label="address bar"
						className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[11px] text-foreground outline-none"
					/>
				</form>
				<span
					className={cn(
						"size-[7px] shrink-0 rounded-full transition-colors duration-300",
						ready
							? "bg-chart-3"
							: busy
								? "animate-pulse bg-primary"
								: "bg-muted-foreground/40",
					)}
				/>
			</div>

			<div className="h-[252px] overflow-hidden bg-background text-foreground">
				<div
					className={cn(
						"h-full overflow-y-auto transition-[opacity,transform] duration-150",
						painting && "translate-y-1.5 opacity-0",
					)}
				>
					{view === "boot" && !booted ? (
						<div className="flex h-full flex-col justify-center px-6 font-mono">
							<div className="text-[13px] font-semibold tracking-[0.22em]">
								MYAPP
							</div>
							<div className="my-[5px] mb-3 text-[9.5px] tracking-[0.05em] text-muted-foreground">
								aura · booting runtime
							</div>
							<div className="h-1 overflow-hidden rounded-sm bg-muted">
								<div
									className="h-full bg-primary"
									style={{ width: `${Math.round(bootProgress * 100)}%` }}
								/>
							</div>
							<div className="mt-[9px] text-[9px] tracking-[0.04em] text-muted-foreground">
								{bootMeta}
							</div>
						</div>
					) : view === "e404" ? (
						<div className="px-4 py-[14px] text-[11px]">
							<ViewportNav
								path={
									addr
										.replace(/^https?:\/\//, "")
										.replace(/^localhost:8080/, "") || "/"
								}
							/>
							<div className="pt-[14px]">
								<b className="block font-serif text-[44px] leading-none font-normal text-destructive">
									404
								</b>
								<span className="mt-1.5 block font-mono text-[10px]">
									NotFoundHttpException
								</span>
								<i className="mt-1 block font-mono text-[9px] text-muted-foreground not-italic">
									no route matched — Router.php:1287
								</i>
							</div>
						</div>
					) : (
						<div className="px-4 py-[14px] text-[11px]">
							<ViewportNav path="/" />
							<div>
								<h4 className="mx-0 mt-0.5 mb-1.5 font-serif text-[23px] font-normal">
									Laravel runs here.
								</h4>
								<p className="mt-0 text-[10.5px] leading-[1.6] text-muted-foreground">
									Rendered inside this tab by PHP&nbsp;8.4 — no server involved.
								</p>
							</div>
							<div className="mt-[14px] border-t border-border">
								{ENV_ROWS.map(([k, v]) => (
									<div
										key={k}
										className="flex justify-between gap-2.5 border-b border-border/70 py-1.5 font-mono text-[9.5px]"
									>
										<span className="text-muted-foreground">{k}</span>
										<b className="text-right font-medium">{v}</b>
									</div>
								))}
							</div>
							<div className="mt-[11px] font-mono text-[9px] tracking-[0.04em] text-muted-foreground/80">
								booted in 214 ms · artifact 8.9 MB · zero network hops
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
				{respOk === null ? (
					respMeta
				) : (
					<>
						<b
							className={cn(
								"font-medium",
								respOk ? "text-chart-3" : "text-destructive",
							)}
						>
							{respMeta.split("·")[0]}
						</b>
						<span> ·{respMeta.split("·").slice(1).join("·")}</span>
					</>
				)}
			</div>
		</div>
	);
}

export function ConsolePanel({ lines }: { lines: ConsoleLine[] }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines.length]);

	return (
		<div className="flex min-h-[210px] flex-1 flex-col">
			<div className="flex h-[34px] items-center justify-between border-b border-border px-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
				<span>console</span>
				<span>laravel.log — live</span>
			</div>
			<div
				ref={ref}
				className="flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-[1.75]"
			>
				{lines.map((l) => (
					<div key={l.id} className="flex items-baseline gap-[11px]">
						<span className="shrink-0 text-muted-foreground/60">{l.t}</span>
						<span className="shrink-0 text-muted-foreground">{l.comp}</span>
						<span
							className={cn(
								"min-w-0 flex-1 break-words",
								l.cls === "req" || l.cls === "ok"
									? "text-foreground"
									: l.cls === "err"
										? "text-destructive"
										: "text-muted-foreground",
							)}
						>
							{l.msg}
						</span>
						{l.ms ? (
							<span
								className={cn(
									"shrink-0",
									l.cls === "err" ? "text-destructive" : "text-chart-3",
								)}
							>
								{l.ms}
							</span>
						) : null}
					</div>
				))}
			</div>
		</div>
	);
}

export function RoutesBar({
	busy,
	activeRoute,
	onNav,
}: {
	busy: boolean;
	activeRoute: string;
	onNav: (path: string) => void;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5",
				busy && "opacity-85",
			)}
		>
			<span className="mr-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
				routes
			</span>
			<button
				onClick={() => onNav("/")}
				className={cn(
					"rounded-md border px-3 py-1.5 font-mono text-[11px] transition",
					activeRoute === "/"
						? "border-primary/60 bg-primary/10 text-primary"
						: "border-border text-muted-foreground hover:text-foreground",
					busy && "pointer-events-none opacity-40",
				)}
			>
				/
			</button>
			<span className="ml-auto hidden font-mono text-[10px] text-muted-foreground md:inline">
				press{" "}
				<kbd className="rounded border border-b-2 border-border px-[5px] py-px font-mono text-[10px] text-muted-foreground">
					/
				</kbd>{" "}
				and type any path — the router is real
			</span>
		</div>
	);
}
