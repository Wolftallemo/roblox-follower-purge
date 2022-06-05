import { request } from "undici";
import getCSRF from "./get_csrf";

async function doRequest(
  cookie: string,
  csrf_token: string,
  target: number,
  action: "block" | "unblock"
): Promise<string> {
  const resp = await request(
    `https://accountsettings.roblox.com/v1/users/${target}/${action}`,
    {
      headers: {
        cookie: `.ROBLOSECURITY=${cookie}`,
        "x-csrf-token": csrf_token,
      },
      method: "POST",
    }
  );
  if (resp.statusCode === 403) {
    const new_token = await getCSRF(cookie);
    await request(
      `https://accountsettings.roblox.com/v1/users/${target}/${action}`,
      {
        headers: {
          cookie: `.ROBLOSECURITY=${cookie}`,
          "x-csrf-token": new_token,
        },
        method: "POST",
      }
    );
    return new_token;
  }
  return csrf_token;
}

export default async function (
  cookie: string,
  csrf_token: string,
  target: number
): Promise<string> {
  try {
    csrf_token = await doRequest(cookie, csrf_token, target, "block");
    csrf_token = await doRequest(cookie, csrf_token, target, "unblock");
  } catch (e) {
    console.error(e + "\nFailed to remove user: " + target.toString());
  }
  return csrf_token;
}
