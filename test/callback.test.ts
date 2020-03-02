import {
  config,
  client,
  replyText,
  handleText
} from "../src/controllers/callback";
import { resolve } from "dns";

jest.mock("@line/bot-sdk");

describe("callback.ts test", () => {
  beforeEach(() => {
    client.replyMessage = jest
      .fn()
      .mockImplementation((token: string, texts: string | string[]) => {
        console.log(`token:${token}, texts:${JSON.stringify(texts)}`);
        return new Promise(resolve => {
          resolve({
            token: token,
            texts: JSON.stringify(texts)
          });
        });
      });
  });
  test("replyText", async () => {
    const expected = await replyText("0000000000", "Hello, World!");
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify([{ type: "text", text: "Hello, World!" }])
    });
  });
  test("handleText profile", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "profile"
      },
      "0000000000",
      {
        type: "user",
        userId: null
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify([
        { type: "text", text: "Bot can't use profile API without user ID" }
      ])
    });
  });
  test("handleText profile", async () => {
    client.getProfile = jest.fn().mockImplementation((userId: string) => {
      console.log(`userId:${userId}`);
      return new Promise(resolve => {
        resolve({
          displayName: "User name",
          pictureUrl: "https://picture.url",
          statusMessage: "So Good",
          userId: userId
        });
      });
    });
    const expected = await handleText(
      {
        type: "text",
        text: "profile"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify([
        { type: "text", text: "Display name: User name" },
        { type: "text", text: "Picture: https://picture.url" },
        { type: "text", text: "Status message: So Good" }
      ])
    });
  });
  test("handleText buttons", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "buttons"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "template",
        altText: "Buttons alt text",
        template: {
          type: "buttons",
          thumbnailImageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
          title: "My button sample",
          text: "Hello, my button",
          actions: [
            { label: "Go to line.me", type: "uri", uri: "https://line.me" },
            { label: "Say hello1", type: "postback", data: "hello こんにちは" },
            {
              label: "言 hello2",
              type: "postback",
              data: "hello こんにちは",
              text: "hello こんにちは"
            },
            { label: "Say message", type: "message", text: "Rice=米" }
          ]
        }
      })
    });
  });
  test("handleText confirm", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "confirm"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "template",
        altText: "Confirm alt text",
        template: {
          type: "confirm",
          text: "Do it?",
          actions: [
            { label: "Yes", type: "message", text: "Yes!" },
            { label: "No", type: "message", text: "No!" }
          ]
        }
      })
    });
  });
  test("handleText carousel", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "carousel"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "template",
        altText: "Carousel alt text",
        template: {
          type: "carousel",
          columns: [
            {
              thumbnailImageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              title: "hoge",
              text: "fuga",
              actions: [
                { label: "Go to line.me", type: "uri", uri: "https://line.me" },
                {
                  label: "Say hello1",
                  type: "postback",
                  data: "hello こんにちは"
                }
              ]
            },
            {
              thumbnailImageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              title: "hoge",
              text: "fuga",
              actions: [
                {
                  label: "言 hello2",
                  type: "postback",
                  data: "hello こんにちは",
                  text: "hello こんにちは"
                },
                { label: "Say message", type: "message", text: "Rice=米" }
              ]
            }
          ]
        }
      })
    });
  });
  test("handleText image carousel", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "image carousel"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "template",
        altText: "Image carousel alt text",
        template: {
          type: "image_carousel",
          columns: [
            {
              imageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              action: {
                label: "Go to LINE",
                type: "uri",
                uri: "https://line.me"
              }
            },
            {
              imageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              action: {
                label: "Say hello1",
                type: "postback",
                data: "hello こんにちは"
              }
            },
            {
              imageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              action: { label: "Say message", type: "message", text: "Rice=米" }
            },
            {
              imageUrl: `${config.baseURL}/images/buttons/1040.jpg`,
              action: {
                label: "datetime",
                type: "datetimepicker",
                data: "DATETIME",
                mode: "datetime"
              }
            }
          ]
        }
      })
    });
  });
  test("handleText datetime", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "datetime"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "template",
        altText: "Datetime pickers alt text",
        template: {
          type: "buttons",
          text: "Select date / time !",
          actions: [
            {
              type: "datetimepicker",
              label: "date",
              data: "DATE",
              mode: "date"
            },
            {
              type: "datetimepicker",
              label: "time",
              data: "TIME",
              mode: "time"
            },
            {
              type: "datetimepicker",
              label: "datetime",
              data: "DATETIME",
              mode: "datetime"
            }
          ]
        }
      })
    });
  });
  test("handleText imagemap", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "imagemap"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({
        type: "imagemap",
        baseUrl: `${config.baseURL}/images/rich`,
        altText: "Imagemap alt text",
        baseSize: { width: 1040, height: 1040 },
        actions: [
          {
            area: { x: 0, y: 0, width: 520, height: 520 },
            type: "uri",
            linkUri: "https://store.line.me/family/manga/en"
          },
          {
            area: { x: 520, y: 0, width: 520, height: 520 },
            type: "uri",
            linkUri: "https://store.line.me/family/music/en"
          },
          {
            area: { x: 0, y: 520, width: 520, height: 520 },
            type: "uri",
            linkUri: "https://store.line.me/family/play/en"
          },
          {
            area: { x: 520, y: 520, width: 520, height: 520 },
            type: "message",
            text: "URANAI!"
          }
        ],
        video: {
          originalContentUrl: `${config.baseURL}/images/imagemap/video.mp4`,
          previewImageUrl: `${config.baseURL}/images/imagemap/preview.jpg`,
          area: {
            x: 280,
            y: 385,
            width: 480,
            height: 270
          },
          externalLink: {
            linkUri: "https://line.me",
            label: "LINE"
          }
        }
      })
    });
  });
  test("handleText bye", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "bye"
      },
      "0000000000",
      {
        type: "user",
        userId: "u0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify([
        {
          type: "text",
          text: "Bot can't leave from 1:1 chat"
        }
      ])
    });
  });
  test("handleText bye", async () => {
    client.leaveGroup = jest.fn().mockImplementation(groupId => {
      console.log(`groupId: ${groupId}`);
      return new Promise(resolve => {
        resolve(groupId);
      });
    });
    const expected = await handleText(
      {
        type: "text",
        text: "bye"
      },
      "0000000000",
      {
        type: "group",
        groupId: "g00001"
      }
    );
    expect(expected).toEqual("g00001");
  });
  test("handleText bye", async () => {
    client.leaveRoom = jest.fn().mockImplementation(roomId => {
      console.log(`room: ${roomId}`);
      return new Promise(resolve => {
        resolve(roomId);
      });
    });
    const expected = await handleText(
      {
        type: "text",
        text: "bye"
      },
      "0000000000",
      {
        type: "room",
        roomId: "r00001"
      }
    );
    expect(expected).toEqual("r00001");
  });
  test("handleText echo", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "echo"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify([{ type: "text", text: "echo" }])
    });
  });
});
