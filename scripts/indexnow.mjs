import fs from "node:fs";
import path from "node:path";

const HOST = "www.skoolvideosaver.com";
const SITE_URL = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const STATIC_PATHS = [
  "/",
  "/blog",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/dmca",
];

function resolveKey(publicDir) {
  const envKey = process.env.INDEXNOW_KEY?.trim();
  if (envKey) {
    if (!/^[a-f0-9]{8,128}$/i.test(envKey)) {
      throw new Error(`Invalid INDEXNOW_KEY format: "${envKey}"`);
    }
    const keyFilePath = path.join(publicDir, `${envKey}.txt`);
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Missing IndexNow key file at ${keyFilePath}`);
    }
    const fileContent = fs.readFileSync(keyFilePath, "utf8").trim();
    if (fileContent !== envKey) {
      throw new Error(`IndexNow key file content mismatch in ${keyFilePath}`);
    }
    return envKey;
  }

  const candidates = fs
    .readdirSync(publicDir)
    .filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));

  if (candidates.length === 0) {
    throw new Error(`No 32-char hex IndexNow key file (<key>.txt) found in ${publicDir}`);
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple IndexNow key files found in ${publicDir}: ${candidates.join(", ")}. Set INDEXNOW_KEY to pick one.`
    );
  }

  const key = candidates[0].replace(/\.txt$/, "");
  const keyFilePath = path.join(publicDir, candidates[0]);
  const fileContent = fs.readFileSync(keyFilePath, "utf8").trim();
  if (fileContent !== key) {
    throw new Error(`IndexNow key file content in ${keyFilePath} does not match filename "${key}"`);
  }
  return key;
}

function normalizeUrl(input) {
  if (input.startsWith("/")) {
    return `${SITE_URL}${input}`;
  }
  const parsed = new URL(input);
  if (parsed.host !== HOST) {
    throw new Error(`URL host "${parsed.host}" does not match expected host "${HOST}"`);
  }
  return parsed.toString();
}

function getAllSitemapUrls(rootDir) {
  const blogDir = path.join(rootDir, "content", "blog");
  let blogPaths = [];
  if (fs.existsSync(blogDir)) {
    blogPaths = fs
      .readdirSync(blogDir)
      .filter((name) => name.endsWith(".md"))
      .sort()
      .map((name) => `/blog/${name.replace(/\.md$/, "")}`);
  }
  return [...STATIC_PATHS, ...blogPaths].map((p) => `${SITE_URL}${p}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const urlArgs = args.filter((arg) => arg !== "--dry-run" && !arg.startsWith("-"));

  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, "public");
  const key = resolveKey(publicDir);

  const urlList =
    urlArgs.length > 0 ? urlArgs.map(normalizeUrl) : getAllSitemapUrls(rootDir);

  if (urlList.length === 0) {
    throw new Error("No URLs resolved to submit to IndexNow.");
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList,
  };

  if (dryRun) {
    console.log(`DRY RUN — would POST to ${ENDPOINT}:`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 200 && response.status !== 202) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}: ${body || response.statusText}`
    );
  }

  console.log(
    `IndexNow accepted ${urlList.length} URL(s) (HTTP ${response.status}).`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
