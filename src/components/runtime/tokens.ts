export const tokens = {
	bg: "#0A0908",
	panel: "#100E0B",
	panel2: "#0D0B09",
	line: "rgba(235,229,220,.08)",
	line2: "rgba(235,229,220,.16)",
	text: "#EDE7DE",
	muted: "#9B948A",
	faint: "#6E6960",
	dim: "#57534B",
	accent: "#FF3B26",
	accentDeep: "#E02418",
	green: "#3ECF8E",
	err: "#FF6B5A",
	mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,monospace",
	sans: "'Instrument Sans',Inter,system-ui,sans-serif",
	serif: "'Instrument Serif',Georgia,serif",
	ease: "cubic-bezier(.22,.75,.2,1)",
} as const;

export type Tokens = typeof tokens;
