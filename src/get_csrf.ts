import { request } from "undici";

export default async function (cookie: string) {
  const resp = await request("https://auth.roblox.com/v2/logout", {
    headers: {
      cookie: `.ROBLOSECURITY=${cookie}`,
    },
    method: "POST",
  });
  if (resp.statusCode !== 403) throw new Error("Failed to retrieve CSRF token");
  return <string>resp.headers["X-CSRF-TOKEN"];
}
