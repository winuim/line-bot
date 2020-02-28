import { Request, Response } from "express";
import * as line from "@line/bot-sdk";

// create LINE SDK config from env variables
export const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
const client = new line.Client(config);

// event handler
function handleEvent(event: {
  type: string;
  message: { type: string; text: string };
  replyToken: string;
}) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo: line.TextMessage = { type: "text", text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo).catch(err => {
    if (err instanceof line.HTTPError) {
      console.error(err.statusCode);
    }
  });
}

/**
 * POST /callback
 *
 */
export const callback = (req: Request, res: Response) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
};
