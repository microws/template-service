import { NextFunction, Request, Response } from "express";
import { MicrowsRouter, flagRouter, parseAuthentication } from "@microws/server";
import bodyParser from "body-parser";

const USER_POOL_ID = "[@TODO USER POOL ID]";
const USER_POOL_CLIENT_ID = "[@TODO USer Pool ClientId]";
let parseAuthenticationMiddleware = parseAuthentication(USER_POOL_ID, USER_POOL_CLIENT_ID);

export const websiteRouter = MicrowsRouter();
websiteRouter.use(parseAuthenticationMiddleware);
websiteRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  res.locals.evidentlyConfig = {
    id: res.locals.user?.id || "guest",
    group: "",
    type: process.env.NODE_ENV == "dev" ? "trunk" : "release",
    context: {},
  };
  next();
});
websiteRouter.use(bodyParser.json({ limit: "2mb" }));
websiteRouter.use(bodyParser.urlencoded({ extended: true }));
websiteRouter.use("/api/service/flag/", flagRouter);

const apiRouter = MicrowsRouter();
websiteRouter.use("/api/service/", apiRouter);
apiRouter.get("/test", async (req, res) => {
  res.json(true);
});
