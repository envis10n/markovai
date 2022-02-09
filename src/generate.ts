import Markov, { _TABLE } from "./markov";
import DB from "./db";
import { ArgumentsCamelCase } from "yargs";

export default async function (
    argv: ArgumentsCamelCase<{ words: number; verbose: boolean }>
) {
    const db = await DB(argv.verbose);
    await _TABLE.ensure();
    if (argv.verbose)
        console.log("[verbose] Generating", argv.words, "word(s)...");
    const result = await Markov.generate(argv.words);
    await db.close();
    console.log(result);
    process.exit(0);
}
