import { request } from "undici";

export default async function (user: number): Promise<number[]> {
  let cursor = "";
  const followers: number[] = [];
  while (true) {
    const resp = await request(
      `https://friends.roblox.com/v1/users/${user}/followers?sortOrder=Desc&limit=100${
        cursor ? `&cursor=${cursor}` : ""
      }`
    );
    if (resp.statusCode !== 200) {
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    const { data, nextPageCursor } = await resp.body.json();
    for (const follower of data) followers.push(follower.id);
    if (!nextPageCursor) break;
    cursor = nextPageCursor;
    await new Promise((r) => setTimeout(r, 500));
  }
  return followers;
}
