import Koa from "koa";
import Router from "@koa/router";
import config from "../config";
import _path from "path";
import { promises as _fs } from "fs";

export interface RouteModule {
    default: Router;
}

export async function loadApp(): Promise<Koa> {
    const _APP = new Koa();
    const _ROUTER = new Router();
    const dir: string[] = (await _fs.readdir(__dirname)).filter(
        (name) => !name.startsWith("index.")
    );
    for (const name of dir) {
        const path = _path.resolve(__dirname, name);
        const mod: RouteModule = await import(path);
        _ROUTER.use(mod.default.routes());
    }
    _APP.use(_ROUTER.routes());

    _APP.listen(config.port);
    return _APP;
}
