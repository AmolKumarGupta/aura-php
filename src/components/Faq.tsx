import { FAQ_ITEMS } from "@/lib/seo";

/**
 * SEO + AEO FAQ section.
 * - Semantic <section> with descriptive <h2> for crawlers.
 * - Native <details>/<summary>: content is in the HTML with zero JS,
 *   so search engines and answer engines can extract Q&A directly.
 * - Copy must stay in sync with the FAQPage JSON-LD in index.html.
 */
export default function Faq() {
	return (
		<section
			id="faq"
			aria-labelledby="faq-heading"
			className="scroll-mt-[90px] py-20"
		>
			<div className="mx-auto w-[min(1200px,calc(100%-48px))]">
				<p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
					FAQ — answers, not servers
				</p>
				<h2
					id="faq-heading"
					className="mt-3 max-w-[640px] font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] font-normal tracking-[-0.01em]"
				>
					Frequently asked questions about running PHP in the browser
				</h2>
				<p className="mt-4 max-w-[580px] text-[16px] leading-[1.7] text-muted-foreground">
					Short, citable answers about how Aura compiles PHP, Laravel and SQLite
					to WebAssembly — written for humans, search engines and AI assistants
					alike.
				</p>

				<div className="mt-10 grid gap-3 md:grid-cols-2">
					{FAQ_ITEMS.map((item) => (
						<details
							key={item.question}
							className="group rounded-xl border border-border bg-card px-5 py-4 open:border-primary/50"
						>
							<summary className="cursor-pointer list-none text-[15px] font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
								<span className="flex items-start justify-between gap-4">
									{item.question}
									<span
										aria-hidden
										className="mt-0.5 shrink-0 font-mono text-primary transition-transform duration-200 group-open:rotate-45"
									>
										+
									</span>
								</span>
							</summary>
							<p className="mt-3 text-[14.5px] leading-[1.7] text-muted-foreground">
								{item.answer}
							</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
