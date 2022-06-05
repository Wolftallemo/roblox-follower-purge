import { request } from "undici";

export default async function (user: number): Promise<number[]> {
  let cursor = "";
  const followings: number[] = [];
  while (true) {
    const followingsResp = await request(
      `https://friends.roblox.com/v1/users/${user}/followings?sortOrder=Desc&limit=100${
        cursor ? `&cursor=${cursor}` : ""
      }`
    );
    if (followingsResp.statusCode !== 200)
      throw new Error("Failed to fetch followings");
    const responseData = await followingsResp.body.json();
    for (const following of responseData.data) followings.push(following.id);
    if (!responseData.nextPageCursor) break;
    cursor = responseData.nextPageCursor;
    await new Promise((r) => setTimeout(r, 500)); // Slow down to reduce chances of rate limiting
  }
  return followings;
}
