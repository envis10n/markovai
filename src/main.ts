import DB, { Table } from "./db";

interface Test {
    derp: string;
    dong: string;
}

async function main() {
    const db = await DB();
    const test = new Table<Test>("test");
    console.log(await test.insert({ derp: "dongus", dong: "this is dong" }));
    console.log(
        await test.run("INSERT INTO test(derp,dong) VALUES(:derp,:dong);", {
            ":derp": "derpus",
            ":dong": "dongus",
        })
    );
    console.log(
        await test.run(
            "INSERT INTO test(derp,dong) VALUES(?,?);",
            "dorpus",
            "derngus"
        )
    );
    console.log(JSON.stringify(await test.all(), null, 4));
    await db.close();
}

main()
    .then(() => {})
    .catch(() => {});
