import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  routeAfterAuth, homeRouteFor, formatAccuracy, describeAddress, describeGpsFix, assertValidLocation,
} from '../src/location.ts';

test('location screens show when permission is off or nothing is saved', () => {
  for (const entry of ['sign_up', 'log_in'] as const) {
    assert.equal(routeAfterAuth(entry, { permissionOn: false, hasSavedLocation: false }), 'location_access');
    assert.equal(routeAfterAuth(entry, { permissionOn: true, hasSavedLocation: false }), 'location_access');
    // A typed address alone is not enough while permission is off (agreed 19 Nov 2026).
    assert.equal(routeAfterAuth(entry, { permissionOn: false, hasSavedLocation: true }), 'location_access');
  }
});

test('permission on and a saved location goes straight to the right Home', () => {
  const ok = { permissionOn: true, hasSavedLocation: true };
  assert.equal(routeAfterAuth('sign_up', ok), 'home_new_user');
  assert.equal(routeAfterAuth('log_in', ok), 'home');
  assert.equal(homeRouteFor('sign_up'), 'home_new_user');
  assert.equal(homeRouteFor('log_in'), 'home');
});

test('accuracy reads like the Figma copy and never understates', () => {
  assert.equal(formatAccuracy(20), 'within 20 m');
  assert.equal(formatAccuracy(17.3), 'within 20 m');
  assert.equal(formatAccuracy(0), 'within 5 m');
  assert.equal(formatAccuracy(123), 'within 130 m');
  assert.equal(formatAccuracy(999), 'within 1000 m');
  assert.equal(formatAccuracy(1000), 'within 1 km');
  assert.equal(formatAccuracy(1240), 'within 1.3 km');
  assert.throws(() => formatAccuracy(-1));
  assert.throws(() => formatAccuracy(Number.NaN));
});

test('addresses describe like the Figma suggestions', () => {
  assert.deepEqual(
    describeAddress({ streetNumber: '12', street: 'Ada George Road', district: 'Mgbuoba', city: 'Port Harcourt', region: 'Rivers' }),
    { label: '12 Ada George Road', addressLine: 'Mgbuoba, Port Harcourt, Rivers' },
  );
  assert.deepEqual(
    describeAddress({ name: 'Ada George Market', subregion: 'Obio-Akpor', region: 'Rivers' }),
    { label: 'Ada George Market', addressLine: 'Obio-Akpor, Rivers' },
  );
  assert.equal(describeAddress({}).label, 'Pinned location');
});

test('a GPS fix shows the area and city with accuracy', () => {
  assert.deepEqual(
    describeGpsFix({ district: 'GRA Phase 2', city: 'Port Harcourt', region: 'Rivers' }, 20),
    { label: 'GRA Phase 2', addressLine: 'Port Harcourt · within 20 m' },
  );
  assert.deepEqual(describeGpsFix({ city: 'Lagos' }, null), { label: 'Lagos', addressLine: '' });
});

test('invalid locations are refused before saving', () => {
  const ok = { label: 'Home', addressLine: null, lat: 6.44, lng: 3.47, accuracyM: 20, source: 'gps' as const };
  assert.doesNotThrow(() => assertValidLocation(ok));
  assert.throws(() => assertValidLocation({ ...ok, label: '  ' }));
  assert.throws(() => assertValidLocation({ ...ok, lat: 91 }));
  assert.throws(() => assertValidLocation({ ...ok, lng: -181 }));
  assert.throws(() => assertValidLocation({ ...ok, accuracyM: -2 }));
  assert.doesNotThrow(() => assertValidLocation({ ...ok, accuracyM: null, source: 'address' }));
});
