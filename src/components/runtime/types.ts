export interface LayerDef {
	name: string;
	desc: string;
	size: string;
}

export interface RouteStep {
	i: number;
	comp: string;
	msg: string;
	ms: number;
	cls?: string;
}

export interface ConsoleLine {
	id: number;
	t: string;
	comp: string;
	msg: string;
	ms: string;
	cls?: string;
}

export interface ResolvedRoute {
	steps: RouteStep[];
	stopLayer: number;
	status: number;
	statusText: string;
	totalMs: number;
	kb: string;
}

export const LAYERS: LayerDef[] = [
	{
		name: "HTTP BRIDGE",
		desc: "service worker · fetch() interception",
		size: "0 KB",
	},
	{ name: "PHP-WASM", desc: "zend vm 4.4 · php 8.4.12", size: "6.2 MB" },
	{
		name: "LARAVEL KERNEL",
		desc: "http kernel · middleware pipeline",
		size: "1.1 MB",
	},
	{ name: "ROUTER", desc: "38 routes · exact + wildcard", size: "0.2 ms" },
	{ name: "ELOQUENT + BLADE", desc: "orm · view compiler", size: "2.8 MB" },
	{
		name: "SQLITE · WASM",
		desc: "in-memory vfs · opfs optional",
		size: "780 KB",
	},
];

export const Y0 = 44;
export const GAP = 90;
export const LH = 64;
export const ENTRY_Y = 34;

export const layerCenterY = (i: number) => Y0 + i * GAP + LH / 2;
