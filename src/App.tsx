import Hero from "./components/Hero";
import RuntimeMachine from "./components/RuntimeMachine";

function App() {
	return (
		<div
			style={{
				background: "#0A0908",
				color: "#EDE7DE",
				minHeight: "100vh",
				fontFamily: "'Instrument Sans',Inter,system-ui,sans-serif",
				scrollBehavior: "smooth",
			}}
		>
			<Hero />
			<RuntimeMachine />
		</div>
	);
}

export default App;
