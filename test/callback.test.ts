import { client, replyText } from "../src/controllers/callback";

jest.mock("@line/bot-sdk");

describe("callback.ts test", () => {
  test("replyText", () => {
    client.replyMessage = jest
      .fn()
      .mockImplementation((replyToken, messages) => {
        console.log(
          `replyToken:${replyToken}, messages:${JSON.stringify(messages)}`
        );
        return Promise.resolve(true);
      });
    const expected = replyText("0000000000", "Hello, World!");
    expect(expected).resolves.toBe(true);
  });
});
