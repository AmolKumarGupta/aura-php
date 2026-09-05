import { useEffect, useState } from "react";
import { usePhp } from "@/lib/hooks/usePhp";
import { Button } from "@/components/ui/button";

function App() {
	const [count, setCount] = useState(0);
	const { php, booted, bootProgress, bootStatus } = usePhp();

	useEffect(() => {
		if (!booted || !php) return;

		(async () => {
			const resp = await php.run({
				code: "<?php echo 'Hello from PHP in browser!';",
			});

			console.log(resp.text);
		})();
	}, [booted, php]);

	return (
		<>
			<div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
				<div style={{ marginBottom: "20px" }}>
					<h2 style={{ marginBottom: "10px" }}>PHP Runtime Status</h2>
					<div>
						Status: <strong>{bootStatus}</strong>
					</div>
					<div>
						Progress: <strong>{Math.round(bootProgress * 100)}%</strong>
					</div>
					<div>
						Booted: <strong>{booted ? "Yes" : "No"}</strong>
					</div>
				</div>
				<section id="text-center">
					<Button onClick={() => setCount((count) => count + 1)}>
						Count is {count}
					</Button>
				</section>
			</div>
		</>
	);
}

export default App;
