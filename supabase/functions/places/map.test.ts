import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidInput, toPlaceDetails, toSuggestions } from './map.ts';

test('autocomplete suggestions read like the Figma list', () => {
  const s = toSuggestions({
    suggestions: [
      { placePrediction: { placeId: 'a1', structuredFormat: { mainText: { text: '12 Ada George Road' }, secondaryText: { text: 'Mgbuoba, Port Harcourt, Rivers, Nigeria' } } } },
      { placePrediction: { placeId: 'a2', text: { text: 'Ada George Market, Nigeria' } } },
      { placePrediction: { text: { text: 'no id' } } },
    ],
  });
  assert.deepEqual(s, [
    { placeId: 'a1', label: '12 Ada George Road', addressLine: 'Mgbuoba, Port Harcourt, Rivers' },
    { placeId: 'a2', label: 'Ada George Market', addressLine: '' },
  ]);
  assert.deepEqual(toSuggestions({}), []);
});

test('place details give a label, the line under it and coordinates', () => {
  const p = toPlaceDetails({
    id: 'a1',
    displayName: { text: '12 Ada George Rd' },
    location: { latitude: 4.8402, longitude: 6.9937 },
    addressComponents: [
      { longText: '12', types: ['street_number'] },
      { longText: 'Ada George Road', types: ['route'] },
      { longText: 'Mgbuoba', types: ['sublocality', 'political'] },
      { longText: 'Port Harcourt', types: ['locality', 'political'] },
      { longText: 'Rivers', types: ['administrative_area_level_1', 'political'] },
      { longText: 'Nigeria', types: ['country', 'political'] },
    ],
  });
  assert.deepEqual(p, { placeId: 'a1', label: '12 Ada George Road', addressLine: 'Mgbuoba, Port Harcourt, Rivers', lat: 4.8402, lng: 6.9937 });
  const market = toPlaceDetails({ id: 'b', displayName: { text: 'Ada George Market' }, location: { latitude: 4.85, longitude: 6.99 },
    addressComponents: [{ longText: 'Obio-Akpor', types: ['administrative_area_level_2'] }, { longText: 'Rivers', types: ['administrative_area_level_1'] }] });
  assert.equal(market.label, 'Ada George Market');
  assert.equal(market.addressLine, 'Obio-Akpor, Rivers');
  assert.throws(() => toPlaceDetails({ id: 'x' }));
});

test('search input must be 3 to 120 characters', () => {
  assert.ok(isValidInput('Ada'));
  assert.ok(!isValidInput('Ad'));
  assert.ok(!isValidInput('x'.repeat(121)));
  assert.ok(!isValidInput(42));
});
