import { ArgumentsCamelCase } from "yargs";
import Markov, { _TABLE } from "./markov";
import DB from "./db";
import { promises as fs } from "fs";
import path from "path";

export default async function (
    argv: ArgumentsCamelCase<{
        filename?: string;
        window: number;
        verbose: boolean;
    }>
) {
    const _unused: (string | number)[] = argv._.slice(1);
    const db = await DB(argv.verbose);
    await _TABLE.ensure();
    if (_unused.length == 0 && argv.filename == undefined) {
        throw new Error("No input provided to parse.");
    }
    let data: string;
    if (argv.filename != undefined) {
        const fpath = path.isAbsolute(argv.filename)
            ? argv.filename
            : path.resolve(process.cwd(), argv.filename);
        data = await fs.readFile(fpath, { encoding: "utf-8" });
    } else {
        data = _unused.join(" ");
    }
    console.log("Parsing data...");
    await Markov.parse(data, argv.window);
    console.log("Done. Goodbye!");
    await db.close();
    process.exit(0);
}
