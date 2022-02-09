import * as rand from "../rand";
import { Table } from "../db";
import { _TABLE } from ".";

export interface SuffixTable {
    prefix: string;
    suffix: string;
}
export const Suffixes = new Table<SuffixTable>("suffixes", {
    prefix: "TEXT",
    suffix: "TEXT",
});

export interface ISuffixMap {
    [key: string]: string[];
}

function min(a: number, b: number): number {
    return a < b ? a : b;
}

/**
 * A markov chain generator that internally stores the parsed input tokens for later use.
 */
export class MarkovGenerator {
    private async getRandomPrefix(): Promise<string> {
        const res = await _TABLE.all("prefix");
        if (res.length == 0) throw new Error("Empty table.");
        const rnd = await rand.randomElement(res);
        if (rnd.prefix == undefined) throw new Error("No prefix");
        return rnd.prefix;
    }
    /**
     * Generate an arbitrary amount of words based on the stored input tokens.
     * @param length The amount of words to generate.
     * @returns Generated text
     */
    public async generate(length: number): Promise<string> {
        const res: string[] = [];
        let prefix: string = await this.getRandomPrefix();
        let suffix: string;
        res.push(prefix);
        while (res.length < length) {
            const suf: string[] = (await _TABLE.select(["suffix"], { prefix }))
                .filter((o) => o.suffix != undefined)
                .map((o) => o.suffix) as string[];
            if (suf != undefined) {
                if (suf.length > 1) {
                    suffix = rand.randomElementSync(suf);
                } else {
                    suffix = suf[0];
                }
                res.push(suffix);
                const t: string[] = prefix.split(" ");
                prefix = `${t[t.length - 1]} ${suffix}`;
            } else {
                prefix = await this.getRandomPrefix();
            }
        }
        return res.join(" ");
    }
    /**
     * Parse input into tokens and store them mapped to each other based on the window size.
     * @param input The input to parse.
     * @param n The window size for parsing tokens.
     */
    public async parse(input: string, n: number = 2) {
        const inp: string[] = input.replace(/\r\n/g, "\n").split(" ");
        const temp: string[] = [];
        for (let t of inp) {
            const reg = /\s/;
            if (reg.test(t)) {
                let m = reg.exec(t);
                let nm = "";
                while (m != null) {
                    const a = t.substring(0, m.index);
                    t = t.substring(m.index + 1);
                    temp.push(nm + a);
                    nm = m[0];
                    m = reg.exec(t);
                }
                if (t.length > 0) temp.push(t);
            } else {
                temp.push(t);
            }
        }
        for (let i = 0; i < temp.length; i++) {
            const ix = min(temp.length - 1, i + n);
            const t = temp.slice(i, ix);
            const prefix = t.join(" ");
            if (prefix.length > 0 && t.length == n) {
                const suffix = temp[ix];
                await _TABLE.insert({ prefix, suffix });
            }
        }
    }
}
