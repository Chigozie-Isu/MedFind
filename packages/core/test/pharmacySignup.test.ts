import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePharmacyDetails, documentFileProblem, formatFileSize, requiredDocumentsUploaded, documentsComplete,
  accountNameMatchesBusiness, isValidAccountNumber, formatAccountNumber, maskedAccount, currentSignupStep,
  canSubmitApplication, canGoLive, normalisePcnNumber, type PharmacyDetailsInput,
} from '../src/pharmacySignup.ts';

const filled: PharmacyDetailsInput = {
  pharmacyName: 'Fuasi Pharmacy',
  phone: '+234 810 987 6543',
  street: 'No. 50 EVO Road',
  area: 'GRA Phase 2',
  cityState: 'Port Harcourt, Rivers State',
  landmark: 'Off Nibble restaurant',
  pin: { lat: 4.8156, lng: 7.0498 },
  superintendentName: 'Yusuf Bilal',
  pcnNumber: 'PCN 0081 4472',
  email: 'yusuf@fuasipharmacy.ng',
  password: 'Fuasi2026',
  confirmPassword: 'Fuasi2026',
  agreedToTerms: true,
};

test('a filled step 1 has no errors', () => {
  assert.deepEqual(validatePharmacyDetails(filled), {});
});

test('step 1 required fields use the Figma copy', () => {
  const empty = { ...filled, pharmacyName: '', phone: '', street: '', area: '', cityState: '', pin: null,
    superintendentName: '', pcnNumber: '', email: '', password: 'Fuasi2026', confirmPassword: '' };
  const e = validatePharmacyDetails(empty);
  assert.equal(e.pharmacyName, 'Enter your pharmacy name');
  assert.equal(e.phone, 'Enter a number patients can call');
  assert.equal(e.street, 'Enter the street');
  assert.equal(e.area, 'Enter the area');
  assert.equal(e.cityState, 'Choose your city and state');
  assert.equal(e.pin, 'Drag the pin to your door before you continue.');
  assert.equal(e.superintendentName, 'Enter the superintendent’s full name');
  assert.equal(e.pcnNumber, 'Enter the PCN registration number');
  assert.equal(e.email, 'Enter a work email');
  assert.equal(e.confirmPassword, 'Type the password again');
});

test('step 1 bad phone, email, password and a missing pin', () => {
  const e = validatePharmacyDetails({ ...filled, phone: '+234 810 987', email: 'yusuf@fuasipharmacy' });
  assert.equal(e.phone, 'Enter the full number, like +234 810 987 6543');
  assert.equal(e.email, 'Enter a full email, like name@pharmacy.ng');
  const p = validatePharmacyDetails({ ...filled, password: 'abcd', confirmPassword: 'abcdefghi' });
  assert.equal(p.password, 'Too short. Use at least 8 characters, with a number.');
  assert.equal(p.confirmPassword, 'Passwords don’t match');
  assert.deepEqual(validatePharmacyDetails({ ...filled, pin: null }), {
    pin: 'Drag the pin to your door so patients and riders find you.',
  });
  // Editing details later skips the account fields.
  assert.deepEqual(validatePharmacyDetails({ ...filled, email: '', password: '', confirmPassword: '', agreedToTerms: false }, false), {});
});

test('PCN numbers compare without spaces or the PCN prefix', () => {
  assert.equal(normalisePcnNumber('PCN 0081 4472'), '00814472');
  assert.equal(normalisePcnNumber('0081-4472'), '00814472');
});

test('documents: PDF, JPG or PNG up to 10 MB; shop photos may be HEIC', () => {
  assert.equal(documentFileProblem('premises_licence', { sizeBytes: 1_258_291, mimeType: 'application/pdf' }), null);
  assert.equal(
    documentFileProblem('superintendent_licence', { sizeBytes: Math.round(20.7 * 1024 * 1024), mimeType: 'application/pdf' }),
    'This file is 20.7 MB. Upload a PDF, JPG or PNG under 10 MB.',
  );
  assert.match(documentFileProblem('cac_certificate', { sizeBytes: 1000, mimeType: 'image/heic' }) ?? '', /can’t be used/);
  assert.equal(documentFileProblem('shop_front', { sizeBytes: 1000, mimeType: 'image/heic' }), null);
  assert.equal(formatFileSize(1_258_291), '1.2 MB');
  assert.equal(formatFileSize(2048), '2 KB');
});

test('three required documents; the shop photo is optional', () => {
  assert.equal(requiredDocumentsUploaded(['premises_licence', 'shop_front']), 1);
  assert.ok(!documentsComplete(['premises_licence', 'superintendent_licence', 'shop_front']));
  assert.ok(documentsComplete(['premises_licence', 'superintendent_licence', 'cac_certificate']));
});

test('payout account must be in the business name', () => {
  assert.ok(accountNameMatchesBusiness('FUASI PHARMACY LTD', 'Fuasi Pharmacy'));
  assert.ok(accountNameMatchesBusiness('FUASI PHARMACY (NIG) LIMITED', 'Fuasi Pharmacy Ltd'));
  assert.ok(accountNameMatchesBusiness('MEDPLUS PHARMACY & STORES', 'MedPlus Pharmacy and Stores'));
  assert.ok(!accountNameMatchesBusiness('GRACE OKAFOR', 'Fuasi Pharmacy'));
  assert.ok(!accountNameMatchesBusiness('FUASI STORES LTD', 'Fuasi Pharmacy'));
  assert.ok(!accountNameMatchesBusiness('ANYTHING', 'Ltd'));
});

test('account numbers are 10 digits and shown in groups', () => {
  assert.ok(isValidAccountNumber('0123 456 789'));
  assert.ok(!isValidAccountNumber('012345678'));
  assert.equal(formatAccountNumber('0123456789'), '0123 456 789');
  assert.equal(maskedAccount('GTBank', '0123456789'), 'GTBank •••• 6789');
});

test('the rail opens at the first unfinished step and submit needs everything', () => {
  const none = { detailsDone: false, documentsUploaded: [], payoutVerified: false, submitted: false };
  assert.equal(currentSignupStep(none), 'details');
  assert.equal(currentSignupStep({ ...none, detailsDone: true }), 'documents');
  const docs = ['premises_licence', 'superintendent_licence', 'cac_certificate'] as const;
  assert.equal(currentSignupStep({ ...none, detailsDone: true, documentsUploaded: docs }), 'payout');
  const all = { detailsDone: true, documentsUploaded: docs, payoutVerified: true, submitted: false };
  assert.equal(currentSignupStep(all), 'review');
  assert.ok(!canSubmitApplication(all, false));
  assert.ok(canSubmitApplication(all, true));
  assert.ok(!canSubmitApplication({ ...all, submitted: true }, true));
});

test('only approved pharmacies can go live', () => {
  assert.ok(canGoLive('approved'));
  for (const s of ['draft', 'submitted', 'rejected'] as const) assert.ok(!canGoLive(s));
});
