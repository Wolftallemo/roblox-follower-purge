import { request } from "undici";

export default async function (cookie: string): Promise<Boolean> {
  const checkResponse = await request(
    "https://auth.roblox.com/v1/account/pin",
    {
      headers: {
        cookie: `.ROBLOSECURITY=${cookie}`,
      },
    }
  );
  if (checkResponse.statusCode !== 200)
    throw new Error(
      `Failed to check pin status: ${await checkResponse.body.text()}`
    );
  return (await checkResponse.body.json()).isEnabled;
}
