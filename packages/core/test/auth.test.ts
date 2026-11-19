import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normaliseNigerianPhone, formatPhoneInternational, maskEmail, maskPhone, formatCountdown, secondsUntil,
  isValidEmail, passwordChecks, isStrongEnoughForSignUp, isStrongEnoughForReset, parseLoginIdentifier,
  validateCustomerLogin, customerLoginFailureErrors, validateCustomerSignUp, wrongCodeMessage, isCompleteCode,
  validateForgotIdentifier, validateNewPassword, validatePharmacySignIn, pharmacySignInFailureErrors, hasErrors,
} from '../src/auth.ts';

test('Nigerian numbers in any common format become +234', () => {
  for (const raw of ['0803 000 2291', '08030002291', '803 000 2291', '+234 803 000 2291', '234-803-000-2291']) {
    assert.equal(normaliseNigerianPhone(raw), '+2348030002291', raw);
  }
  assert.equal(normaliseNigerianPhone('0810 987 6543'), '+2348109876543');
  assert.equal(normaliseNigerianPhone('0701 234 5678'), '+2347012345678');
});

test('short, foreign and landline-looking numbers are refused', () => {
  for (const raw of ['0803 000', '', '0603 000 2291', '+44 7700 900123', '0803 000 22911', 'abc']) {
    assert.equal(normaliseNigerianPhone(raw), null, raw);
  }
});

test('phones and emails are shown and masked like Figma', () => {
  assert.equal(formatPhoneInternational('+2348030000000'), '+234 803 000 0000');
  assert.equal(maskEmail('gracegary@gmail.com'), 'grace****@gmail.com');
  assert.equal(maskEmail('al@x.ng'), 'a****@x.ng');
  assert.equal(maskPhone('+2348030002291'), '+234 803 *** 2291');
});

test('countdowns read 04:59 and never go negative', () => {
  assert.equal(formatCountdown(299), '04:59');
  assert.equal(formatCountdown(45), '00:45');
  assert.equal(formatCountdown(-3), '00:00');
  const now = new Date('2026-11-19T10:00:00Z');
  assert.equal(secondsUntil('2026-11-19T10:05:00Z', now), 300);
  assert.equal(secondsUntil('2026-11-19T09:00:00Z', now), 0);
  assert.equal(secondsUntil(null, now), 0);
});

test('email check accepts real addresses and refuses half-typed ones', () => {
  assert.ok(isValidEmail('gracegary@gmail.com'));
  assert.ok(isValidEmail(' yusuf@fuasipharmacy.ng '));
  assert.ok(!isValidEmail('gracegary@gmail'));
  assert.ok(!isValidEmail('yusuf@fuasipharmacy'));
  assert.ok(!isValidEmail('no at sign.com'));
});

test('sign up needs 8 characters and a number; a reset also needs a symbol', () => {
  assert.ok(!isStrongEnoughForSignUp('abcd'));
  assert.ok(!isStrongEnoughForSignUp('abcdefgh'));
  assert.ok(isStrongEnoughForSignUp('abcdefg1'));
  assert.ok(!isStrongEnoughForReset('abcdefg1'));
  assert.ok(isStrongEnoughForReset('abcdef1!'));
  assert.deepEqual(passwordChecks('ab#1'), { minLength: false, hasNumber: true, hasSymbol: true });
});

test('log in takes an email or a phone number', () => {
  assert.deepEqual(parseLoginIdentifier(' Grace@Gmail.com '), { kind: 'email', value: 'grace@gmail.com' });
  assert.deepEqual(parseLoginIdentifier('0803 000 2291'), { kind: 'phone', value: '+2348030002291' });
  assert.equal(parseLoginIdentifier('gracegary@gmail'), null);
});

test('customer log in errors match the Figma frames', () => {
  assert.deepEqual(validateCustomerLogin({ identifier: '', password: '' }), {
    identifier: 'Enter your email or phone number',
    password: 'Enter your password',
  });
  assert.deepEqual(validateCustomerLogin({ identifier: 'gracegary@gmail', password: 'x' }), { identifier: 'Enter a valid email' });
  assert.deepEqual(validateCustomerLogin({ identifier: 'gracegary@gmail.com', password: 'x' }), {});
  assert.equal(customerLoginFailureErrors('email_not_found').identifier, 'No account uses this email. Check it or sign up.');
  assert.equal(customerLoginFailureErrors('wrong_password').password, 'Wrong password. Try again or tap Forgot password.');
  assert.equal(customerLoginFailureErrors('locked', 299).password, 'Too many wrong tries. Try again in 04:59 mins');
  assert.deepEqual(customerLoginFailureErrors('phone_not_found'), {
    identifier: 'Check your email or phone number',
    password: 'Email or password is wrong. Check both and try again.',
  });
});

test('customer sign up errors match the Figma frames', () => {
  assert.deepEqual(validateCustomerSignUp({ email: '', phone: '', password: '' }), {
    email: 'Enter your email',
    phone: 'Enter your phone number',
    password: 'Create a password',
  });
  assert.deepEqual(validateCustomerSignUp({ email: 'gracegary@gmail', phone: '0803 000', password: 'abcdefg1' }), {
    email: 'Enter a full email, like name@example.com',
    phone: 'Enter all 11 digits, like 0803 123 4567',
  });
  assert.deepEqual(validateCustomerSignUp({ email: 'gracegary@gmail.com', phone: '0803 000 2291', password: 'abcd' }), {
    password: 'Too short. Use at least 8 characters, with a number.',
  });
  assert.ok(!hasErrors(validateCustomerSignUp({ email: 'gracegary@gmail.com', phone: '0803 000 2291', password: 'Qwabble2345' })));
});

test('wrong code counts down from 3 tries', () => {
  assert.equal(wrongCodeMessage(1), 'That code isn’t right. You have 2 tries left.');
  assert.equal(wrongCodeMessage(2), 'That code isn’t right. You have 1 try left.');
  assert.equal(wrongCodeMessage(3), 'That code isn’t right. Ask for a new code.');
  assert.ok(isCompleteCode('124860'));
  assert.ok(!isCompleteCode('12486'));
});

test('forgot password: customers use email or phone, pharmacies email only', () => {
  assert.equal(validateForgotIdentifier('', 'customer'), 'Enter your email or phone number');
  assert.equal(validateForgotIdentifier('0803 000 2291', 'customer'), null);
  assert.equal(validateForgotIdentifier('0803 000 2291', 'pharmacy'), 'Enter a full email, like name@pharmacy.ng');
  assert.equal(validateForgotIdentifier('yusuf@fuasipharmacy.ng', 'pharmacy'), null);
  assert.deepEqual(validateNewPassword({ password: 'abcdef1!', confirm: 'abcdef1?' }), { confirm: 'Passwords don’t match' });
  assert.deepEqual(validateNewPassword({ password: 'abcdef1!', confirm: 'abcdef1!' }), {});
});

test('pharmacy sign in errors match the Figma frames', () => {
  assert.deepEqual(validatePharmacySignIn({ email: '', passcode: '', password: '' }), {
    email: 'Enter your work email',
    passcode: 'Enter your staff passcode',
    password: 'Enter your password',
  });
  assert.equal(validatePharmacySignIn({ email: 'yusuf@fuasipharmacy', passcode: '11001', password: 'x' }).email,
    'Enter a full email, like name@pharmacy.ng');
  assert.deepEqual(validatePharmacySignIn({ email: 'yusuf@fuasipharmacy.ng', passcode: '110 01', password: 'x' }), {});
  assert.equal(pharmacySignInFailureErrors('locked', 299).password, 'Too many wrong tries. Try again in 04:59 or reset your password.');
  assert.equal(pharmacySignInFailureErrors('wrong_passcode').passcode, 'This passcode doesn’t match. Ask your manager for your code.');
});
