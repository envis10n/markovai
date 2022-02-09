import { ArgumentsCamelCase } from "yargs";
import DB from "./db";
import { _TABLE } from "./markov";

export default async function (argv: ArgumentsCamelCase<{ verbose: boolean }>) {
    const db = await DB(argv.verbose);
    await _TABLE.truncate();
    await db.close();
    process.exit(0);
}
