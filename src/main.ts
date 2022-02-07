import { loadApp } from "./web";
import Markov, { _TABLE } from "./markov";
import DB from "./db";

import config from "./config";

async function main() {
    const app = await loadApp();
    console.log("API UP on port", config.port);
    console.log("Loading markov generator...");
    await _TABLE.ensure(); // Ensure the table exists.
    if (0 != await Markov.load()) {
        await _TABLE.truncate(); // Truncate table so we don't duplicate on save.
    }
    Markov.startSave();
}

async function handleExit(signal: string) {
    console.log("[DB] Shutdown initiated...");
    await Markov.save();
    await (await DB()).close();
    console.log("[DB] Done. Goodbye!");
    process.exit(0);
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
process.on("SIGHUP", handleExit);

main()
    .then(() => {})
    .catch((e) => {
        console.error(e);
    });
