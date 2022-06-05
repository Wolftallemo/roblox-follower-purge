import { promisified as regedit } from "regedit";
import { request } from "undici";
import blockAndUnblock from "./block_and_unblock_follower";
import getCSRF from "./get_csrf";
import getFollowers from "./get_followers";
import getFollowings from "./get_followings";
import getFriends from "./get_friends";
import pinEnabled from "./pin_check";
// @ts-expect-error
import * as readline from "readline/promises";

const RBX_KEY = "HKCU\\Software\\Roblox\\RobloxStudioBrowser\\roblox.com";
const COOKIE_REGEX =
  /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_[\dA-F]+/g;

interface AuthenticatedUser {
  id: number;
  name: string;
  displayName: string;
}

async function getAuthenticatedUser(
  cookie: string
): Promise<AuthenticatedUser> {
  const response = await request(
    "https://users.roblox.com/v1/users/authenticated",
    {
      headers: {
        cookie: `.ROBLOSECURITY=${cookie}`,
      },
    }
  );
  if (response.statusCode !== 200)
    throw new Error("Failed to fetch authenticated user");
  return await response.body.json();
}

async function promptForCookie(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const cookieAnswer = await rl.question(
    "Paste your .ROBLOSECURITY cookie here: "
  );
  rl.close();
  const cookieTestReq = await request(
    "https://users.roblox.com/v1/users/authenticated",
    {
      headers: {
        cookie: `.ROBLOSECURITY=${cookieAnswer}`,
      },
    }
  );

  if (cookieTestReq.statusCode !== 200) throw new Error("Invalid cookie");
  return cookieAnswer;
}

(async function () {
  let detectedUser: AuthenticatedUser;
  let robloxCookie: string;
  if (process.platform === "win32") {
    const keyList = await regedit.list([RBX_KEY]);
    robloxCookie = <string>keyList[RBX_KEY].values[".ROBLOSECURITY"]?.value;
    if (robloxCookie.match(COOKIE_REGEX)?.at(0)) {
      robloxCookie = <string>robloxCookie.match(COOKIE_REGEX)?.at(0);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      try {
        detectedUser = await getAuthenticatedUser(robloxCookie);
        const detectedAnswer = await rl.question(
          `We have detected the account ${detectedUser.name}, do you want to use this account? (Y/n) `
        );
        rl.close();
        if (detectedAnswer === "n") {
          robloxCookie = await promptForCookie();
          detectedUser = await getAuthenticatedUser(robloxCookie);
        }
      } catch {
        robloxCookie = await promptForCookie();
        detectedUser = await getAuthenticatedUser(robloxCookie);
      }
    }
  } else {
    robloxCookie = await promptForCookie();
    detectedUser = await getAuthenticatedUser(robloxCookie);
  }
  // @ts-expect-error
  console.log(`Starting with account ${detectedUser.name} in 5 seconds...`);
  await new Promise((r) => setTimeout(r, 5000));
  const hasPin = await pinEnabled(robloxCookie);
  if (hasPin)
    return console.error(
      "You have a pin enabled on your Roblox account; please disable it before continuing."
    );
  // @ts-expect-error
  const friends = await getFriends(detectedUser.id);
  // @ts-expect-error
  const followings = await getFollowings(detectedUser.id);
  const alreadyBlockedUsers = await request(
    "https://accountsettings.roblox.com/v1/users/get-blocked-users",
    {
      headers: {
        cookie: `.ROBLOSECURITY=${robloxCookie}`,
      },
    }
  );
  if (
    alreadyBlockedUsers.statusCode !== 200 ||
    (await alreadyBlockedUsers.body.json()).blockedUserIds.length >= 100
  ) {
    return console.error(
      "You already have 100+ users blocked; please unblock someone to use this tool."
    );
  }
  // @ts-expect-error
  const followers = await getFollowers(detectedUser.id);
  let csrf_token = await getCSRF(robloxCookie);
  for (const follower of followers) {
    if (followings.includes(follower) || friends.includes(follower)) continue;
    csrf_token = await blockAndUnblock(robloxCookie, csrf_token, follower);
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("Finished!");
})();
