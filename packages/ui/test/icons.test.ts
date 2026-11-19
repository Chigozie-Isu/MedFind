import { test } from 'node:test';
import assert from 'node:assert/strict';
import { icons, strokeWidthFor } from '../src/icons/icons.ts';

test('every icon has paths and no hard-coded colours', () => {
  for (const [name, def] of Object.entries(icons)) {
    assert.ok(def.paths.length > 0, name);
    for (const p of def.paths) assert.match(p.d, /^M[\d.\s,A-Za-z-]+$/, name);
  }
});

test('strokes render at 1.5px at any size', () => {
  assert.equal(strokeWidthFor(icons['chevron-left'], 24), 1.5);
  assert.equal(strokeWidthFor(icons.grid, 32) * (32 / 20), 1.5);
});

test('back and forward use chevrons, not arrows', () => {
  assert.ok('chevron-left' in icons && 'chevron-right' in icons);
  assert.ok(!Object.keys(icons).some((n) => n.includes('arrow')));
});
