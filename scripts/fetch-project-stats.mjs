/*
  Build-time project stats (redesign-plan.md §10 /projects). Run manually
  with `npm run projects:fetch-stats`, same convention as covers:generate
  and pdf:cheatsheet — writes a committed JSON cache rather than fetching
  live during `npm run build`, so a Packagist/npm outage or rate limit can
  never fail a deploy. The /projects page reads src/data/project-stats.json
  directly; re-run this script whenever you want fresher numbers.

  The package identifiers here (packagist/npmPackage) are duplicated from
  src/data/projects.ts rather than imported from it — that file is TypeScript
  and this is a plain Node script with no TS loader in the toolchain, and
  there are only six packages, so keeping this list in sync by hand is less
  overhead than adding a build step just for this. If you add a new
  packagist/npmPackage field to projects.ts, add the identifier here too.
*/
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'data', 'project-stats.json');

const PACKAGIST_PACKAGES = [
  'albertoarena/laravel-truss',
  'albertoarena/laravel-event-sourcing-generator',
  'albertoarena/filament-event-sourcing',
  'albertoarena/codemetry',
  'albertoarena/laravel-netsons-deploy',
];
const NPM_PACKAGES = ['@albertoarena/envaudit'];

function parseVersionParts(v) {
  return v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function highestCleanVersion(versionStrings) {
  const clean = versionStrings.filter((v) => /^v?\d+\.\d+\.\d+$/.test(v));
  if (!clean.length) return null;
  clean.sort((a, b) => {
    const pa = parseVersionParts(a);
    const pb = parseVersionParts(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
  return clean[0];
}

async function fetchPackagist(pkg) {
  const res = await fetch(`https://packagist.org/packages/${pkg}.json`);
  if (!res.ok) throw new Error(`Packagist ${pkg}: HTTP ${res.status}`);
  const data = await res.json();
  const versions = Object.keys(data.package.versions ?? {});
  return {
    version: highestCleanVersion(versions),
    installs: data.package.downloads?.total ?? null,
  };
}

async function fetchNpm(pkg) {
  const encoded = encodeURIComponent(pkg);
  const [regRes, downloadsRes] = await Promise.all([
    fetch(`https://registry.npmjs.org/${encoded}/latest`),
    fetch(`https://api.npmjs.org/downloads/point/last-year/${encoded}`),
  ]);
  if (!regRes.ok) throw new Error(`npm registry ${pkg}: HTTP ${regRes.status}`);
  const reg = await regRes.json();
  const downloads = downloadsRes.ok ? await downloadsRes.json() : null;
  return {
    version: reg.version ? `v${reg.version}` : null,
    installs: downloads?.downloads ?? null,
  };
}

async function main() {
  const stats = {};

  for (const pkg of PACKAGIST_PACKAGES) {
    try {
      console.log(`Fetching Packagist: ${pkg}...`);
      stats[pkg] = await fetchPackagist(pkg);
    } catch (err) {
      console.error(`  failed: ${err.message} — leaving out of the cache, page will show a dash`);
    }
  }

  for (const pkg of NPM_PACKAGES) {
    try {
      console.log(`Fetching npm: ${pkg}...`);
      stats[pkg] = await fetchNpm(pkg);
    } catch (err) {
      console.error(`  failed: ${err.message} — leaving out of the cache, page will show a dash`);
    }
  }

  writeFileSync(outPath, JSON.stringify(stats, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(stats).length} package(s) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
