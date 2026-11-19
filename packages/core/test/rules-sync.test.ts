import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as rules from '../src/rules.ts';
import * as auth from '../src/auth.ts';
import * as signup from '../src/pharmacySignup.ts';

// The database enforces the same rules as packages/core. This fails if the numbers drift apart.
const migrations = join(import.meta.dirname, '../../../supabase/migrations');
const sql = readdirSync(migrations).sort().map((f) => readFileSync(join(migrations, f), 'utf8')).join('\n');

function ruleValue(name: string): string {
  const match = sql.match(new RegExp(`private\\.rule_${name}\\(\\)[^$]*\\$\\$ select (?:date )?'?([\\w-]+)'?(?:::bigint)? \\$\\$`));
  assert.ok(match, `rule_${name} not found in migrations`);
  return match[1];
}

test('database rule constants match packages/core', () => {
  assert.equal(Number(ruleValue('approval_window_minutes')), rules.APPROVAL_WINDOW_MINUTES);
  assert.equal(Number(ruleValue('delivery_fee_kobo')), rules.DELIVERY_FEE_KOBO);
  assert.equal(Number(ruleValue('service_fee_kobo')), rules.SERVICE_FEE_KOBO);
  assert.equal(Number(ruleValue('commission_basis_points')), rules.COMMISSION_BASIS_POINTS);
  assert.equal(Number(ruleValue('pickup_window_minutes')), rules.PICKUP_WINDOW_MINUTES);
  assert.equal(Number(ruleValue('stop_reservations_before_close_minutes')), rules.STOP_RESERVATIONS_BEFORE_CLOSE_MINUTES);
  assert.equal(Number(ruleValue('staff_passcode_length')), rules.STAFF_PASSCODE_LENGTH);
  assert.equal(Number(ruleValue('pickup_code_length')), rules.PICKUP_CODE_LENGTH);
  assert.equal(ruleValue('payout_anchor_friday'), rules.PAYOUT_ANCHOR_FRIDAY);
  assert.equal(Number(ruleValue('payout_interval_days')), rules.PAYOUT_INTERVAL_DAYS);
});

test('database enums match packages/core', () => {
  const enumValues = (name: string) => {
    const match = sql.match(new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`));
    assert.ok(match, `${name} enum not found`);
    return [...match[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
  };
  assert.deepEqual(enumValues('reservation_status'), [...rules.RESERVATION_STATUSES]);
  assert.deepEqual(enumValues('prescription_check'), rules.PRESCRIPTION_CHECKS.map((c) => c.key));
});

test('database status transitions match packages/core', () => {
  const fn = sql.slice(sql.indexOf('create function private.can_transition'));
  for (const [from, tos] of Object.entries(rules.STATUS_TRANSITIONS)) {
    if (tos.length === 0) continue;
    const line = fn.match(new RegExp(`when '${from}' then to_status in \\(([^)]*)\\)`));
    assert.ok(line, `no transitions for ${from}`);
    assert.deepEqual([...line[1].matchAll(/'(\w+)'/g)].map((m) => m[1]).sort(), [...tos].sort(), from);
  }
});

test('sign-in lockout and pharmacy application rules match the database', () => {
  assert.equal(Number(ruleValue('sign_in_max_attempts')), auth.SIGN_IN_MAX_ATTEMPTS);
  assert.equal(Number(ruleValue('sign_in_lock_minutes')), auth.SIGN_IN_LOCK_MINUTES);
  const enumValues = (name: string) => {
    const match = sql.match(new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`));
    assert.ok(match, `${name} enum not found`);
    return [...match[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
  };
  assert.deepEqual(enumValues('pharmacy_application_status'), [...signup.PHARMACY_APPLICATION_STATUSES]);
  assert.deepEqual(enumValues('pharmacy_document_kind'), signup.PHARMACY_DOCUMENTS.map((d) => d.kind));
});
