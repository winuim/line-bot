import { Request, Response } from "express";
import {
  Client,
  EventSource,
  TextMessage,
  WebhookEvent,
  Message
} from "@line/bot-sdk";
import botText from "../config/botText.json";
type BotText = typeof botText;
type botTextKey = keyof BotText;

// create LINE SDK config from env variables
export const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
export const client = new Client(config);

// simple reply function
export const replyText = (token: string, texts: string | string[]) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map(text => ({ type: "text", text }))
  );
};

export function handleText(
  message: TextMessage,
  replyToken: string,
  source: EventSource
) {
  switch (message.text) {
    case "profile": {
      if (source.userId) {
        return client
          .getProfile(source.userId)
          .then(profile =>
            replyText(replyToken, [
              `Display name: ${profile.displayName}`,
              `Picture: ${profile.pictureUrl}`,
              `Status message: ${profile.statusMessage}`
            ])
          );
      } else {
        return replyText(
          replyToken,
          "Bot can't use profile API without user ID"
        );
      }
    }
    default: {
      const textKey = message.text;
      if (textKey in botText) {
        const msg = botText[textKey as botTextKey] as Message;
        return client.replyMessage(replyToken, msg);
      } else {
        console.log(`Echo message to ${replyToken}: ${message.text}`);
        return replyText(replyToken, message.text);
      }
    }
  }
}

// event handler
export function handleEvent(event: WebhookEvent) {
  if (event.type === "message") {
    if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
      return console.log(
        "Test hook recieved: " + JSON.stringify(event.message)
      );
    }
  }

  switch (event.type) {
    case "message": {
      const message = event.message;
      switch (message.type) {
        case "text":
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
    }
    default: {
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
  }
}

// POST /callback
export const callback = (req: Request, res: Response) => {
  if (req.body.destination) {
    console.log("Destination User ID: " + req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
};
