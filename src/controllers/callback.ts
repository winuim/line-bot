import cp from "child_process";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  AudioEventMessage,
  Client,
  EventSource,
  ImageEventMessage,
  LocationEventMessage,
  StickerEventMessage,
  TextMessage,
  VideoEventMessage,
  WebhookEvent
} from "@line/bot-sdk";
import responseText from "../config/responseText.json";
type ResponseText = typeof responseText;
type responseTextKey = keyof ResponseText;

// create LINE SDK config from env variables
export const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
  baseURL: process.env.BASE_URL
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
    case "bye": {
      switch (source.type) {
        case "user": {
          return replyText(replyToken, "Bot can't leave from 1:1 chat");
        }
        case "group": {
          return replyText(replyToken, "Leaving group").then(() =>
            client.leaveGroup(source.groupId)
          );
        }
        case "room": {
          return replyText(replyToken, "Leaving room").then(() =>
            client.leaveRoom(source.roomId)
          );
        }
      }
      break;
    }
    default: {
      const textKey = message.text;
      if (textKey in responseText) {
        const responseString = JSON.stringify(
          responseText[textKey as responseTextKey]
        );
        const messages = JSON.parse(
          responseString.replace(/\$BASE_URL/g, config.baseURL)
        );
        return client.replyMessage(replyToken, messages);
      } else {
        console.log(`Echo message to ${replyToken}: ${message.text}`);
        return replyText(replyToken, message.text);
      }
    }
  }
}

function downloadContent(messageId: string, downloadPath: string) {
  return client
    .getMessageContent(messageId)
    .then(
      stream =>
        new Promise((resolve, reject) => {
          const writable = fs.createWriteStream(downloadPath);
          stream.pipe(writable);
          stream.on("end", () => resolve(downloadPath));
          stream.on("error", reject);
        })
    )
    .then(() => {
      return downloadPath;
    });
}

function handleImage(message: ImageEventMessage, replyToken: string) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      __dirname,
      "dist/public/downloaded",
      `${message.id}.jpg`
    );
    const previewPath = path.join(
      __dirname,
      "dist/public/downloaded",
      `${message.id}-preview.jpg`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      downloadPath => {
        // ImageMagick is needed here to run 'convert'
        // Please consider about security and performance by yourself
        cp.execSync(
          `convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`
        );

        return {
          originalContentUrl:
            config.baseURL + "/downloaded/" + path.basename(downloadPath),
          previewImageUrl:
            config.baseURL + "/downloaded/" + path.basename(previewPath)
        };
      }
    );
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl, previewImageUrl }) => {
    return client.replyMessage(replyToken, {
      type: "image",
      originalContentUrl,
      previewImageUrl
    });
  });
}

function handleVideo(message: VideoEventMessage, replyToken: string) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      __dirname,
      "dist/public/downloaded",
      `${message.id}.mp4`
    );
    const previewPath = path.join(
      __dirname,
      "dist/public/downloaded",
      `${message.id}-preview.jpg`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      downloadPath => {
        // FFmpeg and ImageMagick is needed here to run 'convert'
        // Please consider about security and performance by yourself
        cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

        return {
          originalContentUrl:
            config.baseURL + "/downloaded/" + path.basename(downloadPath),
          previewImageUrl:
            config.baseURL + "/downloaded/" + path.basename(previewPath)
        };
      }
    );
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl, previewImageUrl }) => {
    return client.replyMessage(replyToken, {
      type: "video",
      originalContentUrl,
      previewImageUrl
    });
  });
}

function handleAudio(message: AudioEventMessage, replyToken: string) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      __dirname,
      "dist/public/downloaded",
      `${message.id}.m4a`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      downloadPath => {
        return {
          originalContentUrl:
            config.baseURL + "/downloaded/" + path.basename(downloadPath)
        };
      }
    );
  } else {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl }) => {
    return client.replyMessage(replyToken, {
      type: "audio",
      originalContentUrl,
      duration: message.duration
    });
  });
}

function handleLocation(message: LocationEventMessage, replyToken: string) {
  return client.replyMessage(replyToken, {
    type: "location",
    title: message.title,
    address: message.address,
    latitude: message.latitude,
    longitude: message.longitude
  });
}

function handleSticker(message: StickerEventMessage, replyToken: string) {
  return client.replyMessage(replyToken, {
    type: "sticker",
    packageId: message.packageId,
    stickerId: message.stickerId
  });
}

// event handler
function handleEvent(event: WebhookEvent) {
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
        case "image":
          return handleImage(message, event.replyToken);
        case "video":
          return handleVideo(message, event.replyToken);
        case "audio":
          return handleAudio(message, event.replyToken);
        case "location":
          return handleLocation(message, event.replyToken);
        case "sticker":
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
    }
    case "follow": {
      return replyText(event.replyToken, "Got followed event");
    }
    case "unfollow": {
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);
    }
    case "join": {
      return replyText(event.replyToken, `Joined ${event.source.type}`);
    }
    case "leave": {
      return console.log(`Left: ${JSON.stringify(event)}`);
    }
    case "postback": {
      let data = event.postback.data;
      if (data === "DATE" || data === "TIME" || data === "DATETIME") {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      return replyText(event.replyToken, `Got postback: ${data}`);
    }
    case "beacon": {
      return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);
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
