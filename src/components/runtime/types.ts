// Shared runtime-panel types. Route/layer simulation types were removed with
// the old packet-animation code (last-2-commits cleanup) — only the live
// console + preview types remain.

export type PreviewView = "boot" | "idle" | "output";

export interface ConsoleLine {
	id: number;
	t: string;
	comp: string;
	msg: string;
	ms: string;
	cls?: string;
}
