import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNaira } from '../src/money.ts';

test('formats kobo as naira', () => {
  assert.equal(formatNaira(345000), '₦3,450');
  assert.equal(formatNaira(445000), '₦4,450');
  assert.equal(formatNaira(345050), '₦3,450.50');
  assert.equal(formatNaira(5), '₦0.05');
  assert.equal(formatNaira(0), '₦0');
  assert.equal(formatNaira(-100000), '-₦1,000');
  assert.equal(formatNaira(123456789), '₦1,234,567.89');
});

test('rejects fractional kobo', () => {
  assert.throws(() => formatNaira(10.5));
});
