import { useEffect, useState } from "react";
import { getPHPLoaderModule } from "@php-wasm/web-8-4";
import { loadPHPRuntime, PHP } from "@php-wasm/universal";
import { Button } from "@/components/ui/button";

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
			<section id="text-center">
				<Button
					onClick={() => setCount((count) => count + 1)}
				>
					Count is {count}
				</Button>
			</section>
		</>
	);
}

export default App;
