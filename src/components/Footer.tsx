const PRODUCT_LINKS = [
	{ label: "Live runtime", href: "#runtime" },
	{ label: "How virtualization works", href: "#runtime" },
	{ label: "FAQ", href: "#faq" },
	{ label: "Back to top", href: "#top" },
];

const STACK_LINKS = [
	{ label: "PHP 8.4 in WebAssembly", href: "#runtime" },
	{ label: "Laravel 13 in the browser", href: "#runtime" },
	{ label: "SQLite local volume", href: "#runtime" },
	{ label: "Zero-server architecture", href: "#faq" },
];

/**
 * Site footer — semantic <footer> with crawlable nav gives search
 * engines a sitemap-like link graph on this single-page site.
 */
export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-border bg-card/40">
			<div className="mx-auto w-[min(1200px,calc(100%-48px))] py-14">
				<div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
					<div>
						<p className="font-serif text-[26px] leading-none">
							Aura<span className="text-primary">.</span>
						</p>
						<p className="mt-4 max-w-[380px] text-[14.5px] leading-[1.7] text-muted-foreground">
							Aura compiles PHP 8.4, Laravel 13 and SQLite into a single
							WebAssembly artifact. Requests execute inside the browser tab at
							memory speed — nothing leaves your machine.
						</p>
						<p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-muted-foreground/70 uppercase">
							wasm32-wasi · single process · zero i/o
						</p>
					</div>

					<nav aria-label="Product">
						<p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
							Product
						</p>
						<ul className="mt-4 space-y-2.5">
							{PRODUCT_LINKS.map((l) => (
								<li key={l.label}>
									<a
										href={l.href}
										className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
									>
										{l.label}
									</a>
								</li>
							))}
						</ul>
					</nav>

					<nav aria-label="Stack">
						<p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
							Stack
						</p>
						<ul className="mt-4 space-y-2.5">
							{STACK_LINKS.map((l) => (
								<li key={l.label}>
									<a
										href={l.href}
										className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
									>
										{l.label}
									</a>
								</li>
							))}
						</ul>
					</nav>
				</div>

				<div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 font-mono text-[11px] tracking-[0.08em] text-muted-foreground/80">
					<p>
						© {year} Aura — PHP in the browser via WebAssembly. All rights
						reserved.
					</p>
					<p>
						PHP 8.4.12 · Laravel 13.x · SQLite 3.49 ·{" "}
						<a href="#top" className="underline-offset-4 hover:underline">
							aura-php.amolgupta.dev
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
