import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const packageJSON = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
test('front end has start and build scripts', () => {
  assert.equal(packageJSON.scripts.start, 'node server.mjs');
  assert.equal(packageJSON.scripts.build, 'vite build');
});
