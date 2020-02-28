import { Request, Response } from "express";
import { HTTPError, Message, WebhookEvent } from "@line/bot-sdk";

import { client } from "../app";

// event handler
function handleEvent(event: WebhookEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo: Message = { type: "text", text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo).catch(err => {
    if (err instanceof HTTPError) {
      console.error(err);
    }
  });
}

// POST /callback
export const callback = (req: Request, res: Response) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
};
