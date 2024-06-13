import { MicrowsRouter, parseAuthentication, requireGroup } from "@microws/server";
import bodyParser from "body-parser";

export const adminRouter = MicrowsRouter();
adminRouter.use(bodyParser.json({ limit: "2mb" }));
adminRouter.use(bodyParser.urlencoded({ extended: true }));
const USER_POOL_ID = "[@TODO USER POOL ID]";
const USER_POOL_CLIENT_ID = "[@TODO USer Pool Admin ClientId]";
let parseAuthenticationMiddleware = parseAuthentication(USER_POOL_ID, USER_POOL_CLIENT_ID);
adminRouter.use("/api/", parseAuthenticationMiddleware, requireGroup("Admin"));
