import { useCallback, useRef, useState } from "react";
import type { ConsoleLine } from "./types";
import { MAX_CONSOLE_LINES, MAX_STORED_LINES } from "@/lib/phpRunner";

/**
 * Console log store. Owns the mutable counters via refs (no module-level
 * shared state) and caps stored lines so repeated runs can't grow memory
 * unbounded. `pushMirrored` splits multi-line PHP output into one row each.
 */
export function useConsoleLog() {
	const [lines, setLines] = useState<ConsoleLine[]>([]);
	const lineIdRef = useRef(0);
	const wallRef = useRef(0);

	const fmtT = useCallback(() => `+${(wallRef.current / 1000).toFixed(4)}`, []);

	const pushLine = useCallback(
		(t: string, comp: string, msg: string, ms = "", cls = "") => {
			lineIdRef.current += 1;
			const id = lineIdRef.current;
			setLines((prev) => {
				const next = [...prev, { id, t, comp, msg, ms, cls }];
				return next.length > MAX_STORED_LINES
					? next.slice(next.length - MAX_STORED_LINES)
					: next;
			});
		},
		[],
	);

	const pushMirrored = useCallback(
		(text: string, cls: "" | "ok" | "err") => {
			const stamp = fmtT();
			const chunks = text.split("\n");
			const capped =
				chunks.length > MAX_CONSOLE_LINES
					? [
							...chunks.slice(0, MAX_CONSOLE_LINES),
							`… (truncated, +${chunks.length - MAX_CONSOLE_LINES} more lines)`,
						]
					: chunks;
			lineIdRef.current += capped.length;
			const base = lineIdRef.current - capped.length;
			const rows: ConsoleLine[] = [];
			for (let i = 0; i < capped.length; i += 1) {
				const chunk = capped[i];
				if (chunk === "" && cls === "") continue;
				rows.push({
					id: base + i + 1,
					t: stamp,
					comp: "php",
					msg: chunk === "" ? "(empty line)" : chunk,
					ms: "",
					cls,
				});
			}
			if (rows.length > 0) {
				setLines((prev) => {
					const next = [...prev, ...rows];
					return next.length > MAX_STORED_LINES
						? next.slice(next.length - MAX_STORED_LINES)
						: next;
				});
			}
		},
		[fmtT],
	);

	return { lines, wallRef, fmtT, pushLine, pushMirrored };
}

export type ConsoleLog = ReturnType<typeof useConsoleLog>;
