import * as rand from "../rand";
import { Table } from "../db";

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
    public prefixes: string[] = [];
    public suffixes: ISuffixMap = {};
    public clear(): void {
        this.prefixes = [];
        this.suffixes = {};
    }
    public async load(): Promise<number> {
        this.suffixes = {};
        this.prefixes = [];
        const res = await Suffixes.all();
        for (const row of res) {
            if (this.suffixes[row.prefix] == undefined) {
                this.suffixes[row.prefix] = [];
            }
            this.suffixes[row.prefix].push(row.suffix);
            this.prefixes.push(row.prefix);
        }
        return res.length;
    }
    public async save(): Promise<void> {
        await Suffixes.truncate();
        for (const prefix of this.prefixes) {
            for (const suffix of this.suffixes[prefix]) {
                await Suffixes.insert({ prefix, suffix });
            }
        }
    }
    /**
     * Generate an arbitrary amount of words based on the stored input tokens.
     * @param length The amount of words to generate.
     * @returns Generated text
     */
    public generate(length: number): string {
        const res: string[] = [];
        let prefix: string = rand.randomElementSync(this.prefixes);
        let suffix: string;
        res.push(prefix);
        while (res.length < length) {
            const suf = this.suffixes[prefix];
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
                prefix = rand.randomElementSync(this.prefixes);
            }
        }
        return res.join(" ");
    }
    /**
     * Parse input into tokens and store them mapped to each other based on the window size.
     * @param input The input to parse.
     * @param n The window size for parsing tokens.
     */
    public parse(input: string, n: number = 2) {
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
                if (this.suffixes[prefix] == undefined)
                    this.suffixes[prefix] = [];
                this.suffixes[prefix].push(suffix);
                this.prefixes.push(prefix);
            }
        }
    }
}
