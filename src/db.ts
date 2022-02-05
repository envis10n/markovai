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
    constructor(public readonly name: string) {}
    public async all(): Promise<T[]>;
    public async all(...columns: (keyof T)[]): Promise<Partial<T>[]>;
    public async all(...columns: (keyof T)[]): Promise<T[]> {
        const cols = columns.length != 0 ? columns.join(",") : "*";
        const db = await getDB();
        return await db.all<T[]>(`SELECT ${cols} FROM ${this.name};`);
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
