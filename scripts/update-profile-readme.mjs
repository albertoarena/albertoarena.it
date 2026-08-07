// Rewrites the BLOG-POST-LIST block in the albertoarena/albertoarena profile
// README from this repo's built RSS feed. Run after `npm run build`, from
// this repo's deploy CI, so there is no network call to albertoarena.it,
// only a checkout and push against github.com. See
// docs/plans/profile-readme-push.md for the why.
//
// Pure logic lives in the exported functions below so it can be unit
// tested (tests/update-profile-readme.test.ts) without touching the
// filesystem. The CLI entry point at the bottom is the only part that
// reads/writes files or reads env vars.

import { readFileSync, writeFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

export const MAX_POSTS = 5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MARKERS = /(<!-- BLOG-POST-LIST:START -->)[\s\S]*?(<!-- BLOG-POST-LIST:END -->)/;

/** RFC-822 (or anything Date can parse) -> "Aug 5, 2026". UTC, no leading zero on the day. */
export function formatDate(pubDate) {
    const d = new Date(pubDate);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Parsed RSS XML string -> array of {title, link, pubDate}, oldest/newest order preserved as-is. */
export function parseFeedItems(xml) {
    const doc = new XMLParser({ ignoreAttributes: false }).parse(xml);
    let items = doc?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];
    return items;
}

/** Feed items -> the `- <date> · [<title>](<url>)` lines, newest-first input, capped at `max`. */
export function buildListLines(items, max = MAX_POSTS) {
    return items
        .slice(0, max)
        .map((it) => `- ${formatDate(it.pubDate)} · [${String(it.title).trim()}](${String(it.link).trim()})`);
}

/**
 * Replace the content between the BLOG-POST-LIST markers with `lines`, keeping
 * the markers themselves and everything outside them untouched. Returns null
 * if the markers aren't found (caller decides how loud to fail).
 */
export function applyListToReadme(readme, lines) {
    if (!MARKERS.test(readme)) return null;
    const block = "\n" + lines.join("\n");
    return readme.replace(MARKERS, (_m, start, end) => `${start}${block}${end}`);
}

async function main() {
    const RSS_PATH = process.env.RSS_PATH || "dist/rss.xml";
    const README_PATH = process.env.PROFILE_README || "profile/README.md";

    const items = parseFeedItems(readFileSync(RSS_PATH, "utf8"));
    const lines = buildListLines(items);
    if (lines.length === 0) {
        console.error("No feed items parsed; leaving README untouched.");
        process.exit(1);
    }

    const readme = readFileSync(README_PATH, "utf8");
    const updated = applyListToReadme(readme, lines);
    if (updated === null) {
        console.error("Markers not found in profile README.");
        process.exit(1);
    }

    writeFileSync(README_PATH, updated);
    console.log(updated === readme ? "No change." : "Profile README updated.");
}

// Only run the CLI when executed directly (`node scripts/update-profile-readme.mjs`),
// not when the functions above are imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
