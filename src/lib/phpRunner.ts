// Shared constants + pure helpers for executing /app/main.php inside php-wasm.
// Extracted from RuntimeMachine so the component stays an orchestrator
// (rerender-split-combined-hooks) and these stay unit-testable.

export const RUNNER_PATH = "/run-main.php";

// Bootstraps Laravel (same pattern as the original App.tsx demo) so main.php
// runs with facades, Eloquent, views, etc. available.
export const RUNNER_CODE = `<?php
chdir('/app');
require_once '/app/vendor/autoload.php';
$__auraApp = require_once '/app/bootstrap/app.php';
$__auraKernel = $__auraApp->make(Illuminate\\Contracts\\Console\\Kernel::class);
$__auraKernel->bootstrap();
require '/app/main.php';`;

export const MAX_CONSOLE_LINES = 200;
export const MAX_OUTPUT_BYTES = 200_000;
export const MAX_STORED_LINES = 500;

const encoder = new TextEncoder();

export function kbOf(s: string): string {
	const bytes = encoder.encode(s).length;
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}

const HTML_OPEN_TAG =
	/^\s*<(?:!doctype|html|head|body|div|span|p|h\d|pre|script|style|table|svg)\b/i;

// HTML output (e.g. `<script>`, `<pre>`, error pages) renders in the preview
// pane — mirroring it to the console would duplicate it.
export function looksLikeHtml(s: string): boolean {
	return HTML_OPEN_TAG.test(s);
}

export function truncateStdout(stdout: string): string {
	if (stdout.length <= MAX_OUTPUT_BYTES) return stdout;
	return `${stdout.slice(0, MAX_OUTPUT_BYTES)}\n<!-- truncated -->`;
}
