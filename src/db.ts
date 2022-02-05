import sqlite3, { Statement } from "sqlite3";
import { open, Database, ISqlite } from "sqlite";
import config from "./config";

let _DATABASE: Database | null = null;

export default async function getDB(): Promise<Database> {
    if (_DATABASE == null) {
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
