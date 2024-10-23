import { Application, Router } from "@oak/oak";
import SockerRouter from "./routes/SocketRouter.ts";

const app = new Application();
const port = 8000;
const router = new Router();

router.use("/ws", SockerRouter.routes());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen({
  port: port,
  secure: true,
  cert: Deno.readTextFileSync("./assets/cert/cert.crt"),
  key: Deno.readTextFileSync("./assets/cert/cert.key"),
});

console.log("Listening at port:" + port);