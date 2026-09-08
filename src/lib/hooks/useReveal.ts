import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * IntersectionObserver-based reveal hook.
 * Returns a ref callback to attach to elements with optional stagger delay.
 * Pair with `revealClass(visible)` — pure Tailwind, no inline styles.
 */
export function useRevealGroup(count: number, delays?: number[]) {
	const [visible, setVisible] = useState<boolean[]>(() =>
		Array(count).fill(false),
	);
	const refs = useRef<(HTMLElement | null)[]>([]);

	useEffect(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const idx = refs.current.findIndex((el) => el === e.target);
					if (idx === -1) continue;
					const d = delays?.[idx] ?? 0;
					if (d > 0) {
						window.setTimeout(() => {
							setVisible((prev) => {
								if (prev[idx]) return prev;
								const next = [...prev];
								next[idx] = true;
								return next;
							});
						}, d);
					} else {
						setVisible((prev) => {
							if (prev[idx]) return prev;
							const next = [...prev];
							next[idx] = true;
							return next;
						});
					}
					io.unobserve(e.target);
				}
			},
			{ threshold: 0.15 },
		);
		for (const el of refs.current) {
			if (el) io.observe(el);
		}
		return () => io.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const setRef = (idx: number) => (el: HTMLElement | null) => {
		refs.current[idx] = el;
	};

	return { visible, setRef };
}

export function revealClass(v: boolean): string {
	return cn(
		"transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,0.75,0.2,1)]",
		v ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
	);
}
