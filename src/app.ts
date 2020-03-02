import express from "express";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import morgan from "morgan";
import path from "path";
import {
  JSONParseError,
  SignatureValidationFailed,
  middleware
} from "@line/bot-sdk";

// Controllers (route handlers)
import * as callbackController from "./controllers/callback";

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(morgan("combined"));

// serve static files
app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

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
app.get("/callback", (req, res) => {
  res.end("I'm listening. Please access with POST.");
});
app.post(
  "/callback",
  middleware(callbackController.config),
  callbackController.callback
);

export default app;
