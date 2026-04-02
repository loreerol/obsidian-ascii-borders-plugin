import manifest from '../manifest.json';
import pkg from '../package.json';
import versions from '../versions.json';

const manifestVersion = manifest.version;
const pkgVersion = pkg.version;
const latestVersionsKey = Object.keys(versions).at(-1);

let failed = false;

if (manifestVersion !== pkgVersion) {
  console.error(
    `Version mismatch: manifest.json (${manifestVersion}) !== package.json (${pkgVersion})`
  );
  failed = true;
}

if (manifestVersion !== latestVersionsKey) {
  console.error(
    `Version mismatch: manifest.json (${manifestVersion}) !== latest key in versions.json (${latestVersionsKey})`
  );
  failed = true;
}

if (failed) process.exit(1);

console.log(`✓ All versions consistent: ${manifestVersion}`);
