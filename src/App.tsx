import { useEffect, useState } from "react";
import "./App.css";
import { getPHPLoaderModule } from "@php-wasm/web-8-4";
import { loadPHPRuntime, PHP } from "@php-wasm/universal";

function App() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		(async () => {
			const loaderModule = await getPHPLoaderModule();
			const runtimeId = await loadPHPRuntime(loaderModule);
			const php = new PHP(runtimeId);

			// console.log(php)

			const resp = await php.run({
				code: "<?php echo 'Hello';",
			});

			console.log(resp.text);
		})();
	}, []);

	return (
		<>
			<section id="center">
				<button
					type="button"
					className="counter"
					onClick={() => setCount((count) => count + 1)}
				>
					Count is {count}
				</button>
			</section>
		</>
	);
}

export default App;
