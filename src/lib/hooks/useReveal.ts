import { useEffect, useRef, useState } from "react";

interface RevealState {
	visible: boolean;
	delay: number;
}

/**
 * IntersectionObserver-based reveal hook.
 * Returns a ref callback to attach to elements with optional stagger delay.
 * Uses pure inline styles (opacity / transform) — no global CSS needed.
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

export function revealStyle(v: boolean): React.CSSProperties {
	return {
		opacity: v ? 1 : 0,
		transform: v ? "none" : "translateY(16px)",
		transition:
			"opacity .7s cubic-bezier(.22,.75,.2,1),transform .7s cubic-bezier(.22,.75,.2,1)",
	};
}

export type { RevealState };
