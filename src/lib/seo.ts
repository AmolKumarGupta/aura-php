export const SITE = {
	name: "Aura",
	tagline: "PHP, compiled. The server, deleted.",
	description:
		"Aura compiles PHP 8.4, Laravel 13 and SQLite into a single WebAssembly artifact that runs entirely in your browser. Zero servers, zero network hops — nothing leaves your machine.",
	url: "https://aura-php.amolgupta.dev/",
	ogImage: "https://aura-php.amolgupta.dev/og-image.svg",
	locale: "en_US",
	twitter: "@aura_php",
} as const;

export interface FaqItem {
	question: string;
	answer: string;
}

/**
 * Single source of truth for visible FAQ copy.
 * IMPORTANT: keep in sync with the FAQPage JSON-LD block in index.html —
 * search and answer engines require visible copy to match structured data.
 */
export const FAQ_ITEMS: FaqItem[] = [
	{
		question: "What is Aura?",
		answer:
			"Aura is a zero-server PHP runtime. It compiles PHP 8.4, the Laravel 13 framework, your application code and a SQLite volume into a single static WebAssembly artifact that executes entirely inside the browser tab.",
	},
	{
		question: "How does PHP run in the browser without a server?",
		answer:
			"The PHP interpreter is compiled to wasm32-wasi. When you press run, your main.php entrypoint executes inside that in-browser interpreter at memory speed — there are zero network hops and no backend to deploy.",
	},
	{
		question: "Which PHP and Laravel versions does Aura support?",
		answer:
			"Aura ships PHP 8.4.12, Laravel 13.x and SQLite 3.49 in an ~8.9 MB compressed artifact with a ~42 MB in-browser resident set.",
	},
	{
		question: "Does my code or data leave my machine?",
		answer:
			"No. Execution happens locally in the browser tab via WebAssembly. Nothing is sent to a server — there is no server.",
	},
	{
		question: "What can I build with Aura?",
		answer:
			"Prototypes, Laravel route handlers, SQLite-backed demos, PHP learning sandboxes and offline-capable tools — anything that fits a single-process PHP runtime with a local SQLite volume.",
	},
	{
		question: "Is Aura free?",
		answer:
			"Yes. The in-browser runtime is free to try — open the page, launch the runtime and run PHP immediately with nothing to install.",
	},
];
