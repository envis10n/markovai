import sqlite3, { Statement } from "sqlite3";
import { open, Database, ISqlite } from "sqlite";
import config from "./config";

sqlite3.verbose();

let _DATABASE: Database | null = null;

export default async function getDB(
    verbose: boolean = false
): Promise<Database> {
    if (_DATABASE == null) {
        if (verbose) sqlite3.verbose();
        _DATABASE = await open({
            filename: config.database,
            driver: sqlite3.cached.Database,
        });
    }
    return _DATABASE;
}

export class Table<T> {
    public readonly _createQuery: string;
    public readonly _dropQuery: string;
    constructor(
        public readonly name: string,
        private struct: { [K in keyof T]: "TEXT" | "INT" }
    ) {
        const cols = Object.keys(this.struct);
        const coldef = cols
            .map((c) => `${c} ${this.struct[c as keyof T]}`)
            .join(",");
        this._createQuery = `CREATE TABLE ${this.name} (${coldef});`;
        this._dropQuery = `DROP TABLE ${this.name};`;
    }
    public async query<K = T[]>(query: ISqlite.SqlType): Promise<K> {
        const db = await getDB();
        return await db.all<K>(query);
    }
    public async select(
        cols: (keyof T)[],
        condition?: Partial<T>
    ): Promise<Partial<T>[]> {
        const cond =
            condition == undefined
                ? ";"
                : ` WHERE ${Object.keys(condition)
                      .map((k) => `${k} = :${k}`)
                      .join(" AND ")};`;
        const cond2: { [key: string]: any } | undefined =
            condition == undefined ? undefined : {};
        if (cond2 != undefined && condition != undefined) {
            for (const k of Object.keys(condition)) {
                cond2[`:${k}`] = condition[k as keyof T];
            }
        }
        const query = `SELECT ${cols.join(",")} FROM ${this.name}${cond}`;
        const db = await getDB();
        if (condition == undefined) return await db.all<Partial<T>[]>(query);
        else return await db.all<Partial<T>[]>(query, cond2);
    }
    public async all(): Promise<T[]>;
    public async all(...columns: (keyof T)[]): Promise<Partial<T>[]>;
    public async all(...columns: (keyof T)[]): Promise<T[]> {
        const cols = columns.length != 0 ? columns.join(",") : "*";
        const db = await getDB();
        return await db.all<T[]>(`SELECT ${cols} FROM ${this.name};`);
    }
    public async truncate(): Promise<ISqlite.RunResult<Statement>> {
        try {
            await this.drop();
        } catch (e) {
            // might not have existed.
        }
        return await this.create();
    }
    public async create(): Promise<ISqlite.RunResult<Statement>> {
        return await this.run(this._createQuery);
    }
    public async drop(): Promise<ISqlite.RunResult<Statement>> {
        return await this.run(this._dropQuery);
    }
    public async ensure(): Promise<void> {
        const db = await getDB();
        try {
            await db.run(`SELECT * FROM ${this.name};`);
        } catch (e) {
            await this.create();
        }
    }
    public async insert(data: T): Promise<ISqlite.RunResult<Statement>> {
        const db = await getDB();
        const cols = Object.keys(data);
        const vals = Object.values(data);
        const sql = `INSERT INTO ${this.name}(${cols.join(
            ","
        )}) VALUES (${new Array(cols.length).fill("?").join(",")});`;
        return await db.run(sql, ...vals);
    }
    public async run(
        query: ISqlite.SqlType
    ): Promise<ISqlite.RunResult<Statement>>;
    public async run(
        query: ISqlite.SqlType,
        params: { [key: string]: any }
    ): Promise<ISqlite.RunResult<Statement>>;
    public async run(
        query: ISqlite.SqlType,
        ...params: any[]
    ): Promise<ISqlite.RunResult<Statement>>;
    public async run(
        query: ISqlite.SqlType,
        ...params: any[]
    ): Promise<ISqlite.RunResult<Statement>> {
        const db = await getDB();
        return await db.run(query, ...params);
    }
}
