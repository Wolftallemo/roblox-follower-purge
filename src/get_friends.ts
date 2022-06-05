import { request } from "undici";

interface friend {
  isOnline: boolean;
  presenceType: string;
  isDeleted: boolean;
  friendFrequentScore: number;
  friendFrequentRank: number;
  description: string;
  created: string; // Technically an ISO8601 timestamp, but JSON doesn't have a type for that
  isBanned: boolean;
  externalAppDisplayName: string;
  id: number;
  name: string;
  displayName: string;
}

export default async function (user: number): Promise<number[]> {
  const friendsRequest = await request(
    `https://friends.roblox.com/v1/users/${user}/friends`
  );
  if (friendsRequest.statusCode !== 200)
    throw new Error("Failed to retrieve friends list, try again later.");
  const friends: friend[] = (await friendsRequest.body.json()).data;
  const list: number[] = [];
  for (const friend of friends) list.push(friend.id);
  return list;
}
