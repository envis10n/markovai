import Router from "@koa/router";
import v1 from "./v1";

const _ROUTER = new Router({prefix: "/api"});

_ROUTER.use(v1.routes());

export default _ROUTER;