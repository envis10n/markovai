import DB from "./db";
import { MarkovGenerator, Suffixes } from "./markov/generator";

async function main() {
    const db = await DB();
    await Suffixes.ensure();
    const generator = new MarkovGenerator();
    const loaded = await generator.load();
    await Suffixes.truncate();
    console.log("Loaded", loaded, "suffix row(s).");
    await generator.save();
    await db.close();
}

main()
    .then(() => {})
    .catch((e) => {
        console.error(e);
    });
