import express from "express";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import bodyParser from "body-parser";
import morganBody from "morgan-body";
import morgan from "morgan";
import {
  Client,
  middleware,
  JSONParseError,
  SignatureValidationFailed
} from "@line/bot-sdk";

// Controllers (route handlers)
import * as homeController from "./controllers/home";

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
export const client = new Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(morgan("combined"));

// error handling
app.use(
  (
    err: ErrorRequestHandler,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof SignatureValidationFailed) {
      res.status(401).send(err.signature);
      return;
    } else if (err instanceof JSONParseError) {
      res.status(400).send(err.raw);
      return;
    }
    next(err); // will throw default 500
  }
);

// webhook callback
app.use("/callback", middleware(config));
app.use(bodyParser.json());
morganBody(app);
app.get("/callback", (req, res) => {
  res.end("I'm listening. Please access with POST.");
});
app.post("/callback", homeController.callback);

export default app;
