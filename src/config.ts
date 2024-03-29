import fs from "fs";
import path from "path";

const CONFIG_PATH: string = path.resolve(process.cwd(), "config.json");

export interface IConfig {
    database: string;
    port: number;
}

const conf: Partial<IConfig> = JSON.parse(
    ((): string => {
        try {
            return fs.readFileSync(CONFIG_PATH, { encoding: "utf-8" });
        } catch (e) {
            return "{}";
        }
    })()
);

const _CONF: IConfig = {
    database: conf.database || "markov.db",
    port: conf.port || 3000,
};

export default _CONF;
