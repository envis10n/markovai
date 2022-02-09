import Router from "@koa/router";
import Markov from "../../../markov";

const _ROUTER = new Router({ prefix: "/v1" });

const _MARKOV = new Router({ prefix: "/markov" });

_ROUTER.get("/test", (ctx, next) => {
    ctx.body = {
        ts: Date.now(),
        ok: true,
    };
    ctx.status = 200;
});

_ROUTER.use(_MARKOV.routes());

export default _ROUTER;
