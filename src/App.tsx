import { useEffect } from "react";
import Hero from "./components/Hero";
import RuntimeMachine from "./components/RuntimeMachine";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import { usePhp } from "./lib/hooks/usePhp";
import useLaravel from "./lib/hooks/useLaravel";

function App() {
	const { booted, php, bootProgress, stats: phpStats } = usePhp();
	const {
		bootLaravel,
		laravelBooted,
		laravelBootProgress,
		laravelBootStatus,
		stats: laravelStats,
	} = useLaravel();

	// Boot Laravel once the WASM runtime is up. bootLaravel is stable
	// (useCallback + init-once guard), so deps are exhaustive with no
	// eslint-disable. Failures are logged — the preview pane surfaces them.
	useEffect(() => {
		if (!booted || !php) return;
		bootLaravel(php).catch((e) => {
			console.error("[aura] laravel boot failed", e);
		});
	}, [booted, php, bootLaravel]);

	return (
		<div className="min-h-screen bg-background font-sans text-foreground">
			<Hero />
			<main>
				<RuntimeMachine
					php={php}
					filesReady={laravelBooted}
					phpReady={booted}
					phpStats={phpStats}
					phpProgress={bootProgress}
					laravelStats={laravelStats}
					laravelProgress={laravelBootProgress}
					laravelStatus={laravelBootStatus}
				/>
				<Faq />
			</main>
			<Footer />
		</div>
	);
}

export default App;
