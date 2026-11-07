// Chrome Web Store listing — every "Get It Now" button on the site points here.
// Override with NEXT_PUBLIC_CHROME_STORE_URL if the listing URL ever changes.
export const CHROME_STORE_EXTENSION_ID = "elgolnjjeieninahlmogcoijmmmobdca";
export const CHROME_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_STORE_URL ||
  `https://chromewebstore.google.com/detail/${CHROME_STORE_EXTENSION_ID}`;

// Discord server invite, used for customer support links.
export const DISCORD_INVITE_URL = "https://discord.gg/NCnd8yJ5aR";

// Canonical production origin. Vercel redirects the apex to www, so everything
// that emits absolute URLs (canonicals, sitemap, OG, JSON-LD) must use this.
export const SITE_URL = "https://www.skoolvideosaver.com";
export const SITE_NAME = "Video Saver for Skool";
export const FREE_DOWNLOADS = 5;
