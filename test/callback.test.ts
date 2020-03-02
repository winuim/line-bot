import { client, replyText, handleText } from "../src/controllers/callback";

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
  test("handleText ping", async () => {
    const expected = await handleText(
      {
        type: "text",
        text: "ping"
      },
      "0000000000",
      {
        type: "user",
        userId: "0000000001"
      }
    );
    expect(expected).toEqual({
      token: "0000000000",
      texts: JSON.stringify({ type: "text", text: "pong" })
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
});
