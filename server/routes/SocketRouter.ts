import { Router, Context } from "@oak/oak";
import socketControll from "../controllers/Socket/socketControll.ts";

const router = new Router();

// Websocket handle
router.get("/", (ctx: Context) => socketControll(ctx));


export default router;