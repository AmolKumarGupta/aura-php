import { ArrowDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { revealClass, useRevealGroup } from "@/lib/hooks/useReveal";
import { buttonVariants } from "@/components/ui/button";

const STATS: [string, string][] = [
	["runtime", "PHP 8.4.12"],
	["framework", "Laravel 13.x"],
	["storage", "SQLite 3.49"],
	["artifact", "8.9 MB"],
];

export default function Hero() {
	const { visible, setRef } = useRevealGroup(4, [0, 80, 160, 220]);

	return (
		<header id="top" className="relative overflow-x-clip pt-[158px]">
			{/* dotted backdrop */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-25 [background-image:radial-gradient(color-mix(in_oklch,var(--foreground)_13%,transparent)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(#000_0%,transparent_92%)]"
			/>
			<div className="relative mx-auto w-[min(1200px,calc(100%-48px))]">
				<h1
					ref={setRef(0) as React.Ref<HTMLHeadingElement>}
					className={cn(
						revealClass(visible[0]),
						"relative m-0 font-serif text-[clamp(52px,7.4vw,98px)] leading-[0.98] font-normal tracking-[-0.015em]",
					)}
				>
					PHP, compiled.
					<br />
					<em className="italic">
						The server, <span className="text-primary">deleted.</span>
					</em>
				</h1>

				<p
					ref={setRef(1) as React.Ref<HTMLParagraphElement>}
					className={cn(
						revealClass(visible[1]),
						"relative mt-[30px] max-w-[580px] text-[17px] leading-[1.68] text-muted-foreground",
					)}
				>
					Aura compiles the entire Laravel stack — the PHP runtime, the
					framework, your code and a SQLite volume — into one static WebAssembly
					artifact. Requests execute inside the browser tab, at memory speed.{" "}
					<strong className="font-medium text-foreground">
						Nothing leaves the machine.
					</strong>
				</p>

				<div
					ref={setRef(2) as React.Ref<HTMLDivElement>}
					className={cn(
						revealClass(visible[2]),
						"relative mt-[38px] flex flex-wrap gap-[14px]",
					)}
				>
					<a
						href="#runtime"
						id="ctaLaunch"
						className={cn(
							buttonVariants({ size: "lg" }),
							"h-auto gap-[9px] rounded-lg px-[22px] py-[14px] text-[15px] font-semibold",
						)}
					>
						Launch the runtime
						<ArrowUpRight className="size-[15px]" />
					</a>
					<a
						href="#runtime"
						className={cn(
							buttonVariants({ size: "lg", variant: "outline" }),
							"h-auto gap-[9px] rounded-lg px-[22px] py-[14px] text-[15px] font-semibold",
						)}
					>
						How virtualization works
						<ArrowDown className="size-[15px]" />
					</a>
				</div>

				<div
					ref={setRef(3) as React.Ref<HTMLDivElement>}
					className={cn(
						revealClass(visible[3]),
						"relative mt-[60px] flex flex-wrap font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase",
					)}
				>
					{STATS.map(([k, v]) => (
						<div
							key={k}
							className="my-[6px] mr-6 border-r border-border py-[6px] pr-6"
						>
							{k}
							<b className="ml-[7px] font-medium text-foreground">{v}</b>
						</div>
					))}
					<div className="my-[6px] py-[6px] pr-6">
						network hops
						<b className="ml-[7px] font-medium text-primary">0</b>
					</div>
				</div>

				<div className="absolute top-[340px] -right-16 hidden border-l border-border py-0 pr-0 pl-[14px] font-mono text-[10px] tracking-[0.34em] text-muted-foreground/60 uppercase [writing-mode:vertical-rl] xl:block">
					wasm32-wasi · single process · zero i/o
				</div>
			</div>
		</header>
	);
}
