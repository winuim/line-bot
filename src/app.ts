import express from "express";
import morgan from "morgan";

import * as line from "@line/bot-sdk";

// Controllers (route handlers)
import * as homeController from "./controllers/home";

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(morgan("combined"));

app.get("/callback", (req, res) => {
  res.end("I'm listening. Please access with POST.");
});

// webhook callback
app.post(
  "/callback",
  line.middleware(homeController.config),
  homeController.callback
);

export default app;
