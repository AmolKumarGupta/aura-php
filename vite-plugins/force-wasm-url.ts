import type { Plugin } from "vite";

export default function forceWasmUrl(): Plugin {
	return {
		name: "force-wasm-url",
		enforce: "pre",
		// @ts-expect-error because i am unable to find corrent type
		async resolveId(
			source: string,
			importer: string | undefined,
			options: { skipSelf?: boolean },
		): Promise<unknown> {
			if (source.endsWith(".wasm") && importer?.includes("@php-wasm")) {
				const resolution = await this.resolve(source, importer, {
					skipSelf: true,
					...options,
				});
				if (resolution) {
					return `${resolution.id}?url`;
				}
			}
			return null;
		},
	};
}
