import { useEffect } from "react";
import Hero from "./components/Hero";
import RuntimeMachine from "./components/RuntimeMachine";
import { usePhp } from "./lib/hooks/usePhp";
import useLaravel from "./lib/hooks/useLaravel";

function App() {
	const { booted, php } = usePhp();
	const { bootLaravel, laravelBooted } = useLaravel();

	useEffect(() => {
		if (booted === true && php) {
			(async () => {
				await bootLaravel(php);
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [booted, php]);

	return (
		<div className="min-h-screen bg-background font-sans text-foreground">
			<Hero />
			<RuntimeMachine php={php} filesReady={laravelBooted} />
		</div>
	);
}

export default App;
