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
				console.log({ booted });
				await bootLaravel(php);
				// php.writeFile(
				// 	"/script.php",
				// 	`<?php
				//       use Symfony\\Component\\Console\\Output\\ConsoleOutput;

				//       chdir('/app');
				//       require '/app/vendor/autoload.php';

				//       $app = require_once '/app/bootstrap/app.php';
				//       $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
				//       $kernel->bootstrap();

				//       $output = new ConsoleOutput;
				//       $output->setDecorated(true);
				//       \\Illuminate\\Support\\Facades\\Artisan::call('list', outputBuffer: $output);
				//     `,
				// );

				// const resp = await php.runStream({
				// 	scriptPath: "/script.php",
				// });

				// console.log(await resp.stdoutText);
			})();
		}
	}, [booted, php, bootLaravel]);

	return (
		<div className="min-h-screen bg-background font-sans text-foreground">
			<Hero />
			<RuntimeMachine php={php} filesReady={laravelBooted} />
		</div>
	);
}

export default App;
