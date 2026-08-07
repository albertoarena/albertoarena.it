// Rewrites the BLOG-POST-LIST block in the albertoarena/albertoarena profile
// README from this repo's built RSS feed. Run after `npm run build`, from
// this repo's deploy CI, so there is no network call to albertoarena.it,
// only a checkout and push against github.com. See
// docs/plans/profile-readme-push.md for the why.

import { readFileSync, writeFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

const RSS_PATH = process.env.RSS_PATH || "dist/rss.xml";
const README_PATH = process.env.PROFILE_README || "profile/README.md";
const MAX = 5;

const doc = new XMLParser({ ignoreAttributes: false }).parse(readFileSync(RSS_PATH, "utf8"));
let items = doc?.rss?.channel?.item ?? [];
if (!Array.isArray(items)) items = [items];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (p) => {
    const d = new Date(p);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

const lines = items
    .slice(0, MAX)
    .map((it) => `- ${fmtDate(it.pubDate)} · [${String(it.title).trim()}](${String(it.link).trim()})`);

if (lines.length === 0) {
    console.error("No feed items parsed; leaving README untouched.");
    process.exit(1);
}

const block = "\n" + lines.join("\n");
const markers = /(<!-- BLOG-POST-LIST:START -->)[\s\S]*?(<!-- BLOG-POST-LIST:END -->)/;
const readme = readFileSync(README_PATH, "utf8");
if (!markers.test(readme)) {
    console.error("Markers not found in profile README.");
    process.exit(1);
}

const updated = readme.replace(markers, (_m, start, end) => `${start}${block}${end}`);
writeFileSync(README_PATH, updated);
console.log(updated === readme ? "No change." : "Profile README updated.");
