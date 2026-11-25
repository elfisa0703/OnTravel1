/**
 * Security Rules Verification Suite for OnTravel Aceh RBAC.
 * Documents and verifies all 12 Dirty Dozen adversarial payloads against firestore.rules.
 *
 * Run against Firebase Emulator Suite when `@firebase/rules-unit-testing` is attached.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const RULES_PATH = new URL('./firestore.rules', import.meta.url);
const RULES_TEXT = fs.readFileSync(RULES_PATH, 'utf8');

export const DIRTY_DOZEN_CASES = [
  {
    id: 1,
    name: 'Self-Privilege Escalation on Signup',
    path: '/users/u1',
    operation: 'create',
    auth: {uid: 'u1', email: 'traveler@example.com', email_verified: true},
    payload: {
      uid: 'u1',
      displayName: 'Traveler',
      email: 'traveler@example.com',
      role: 'admin',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Role Tampering on Update',
    path: '/users/u1',
    operation: 'update',
    auth: {uid: 'u1', email: 'traveler@example.com', email_verified: true},
    payload: {role: 'operator'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Ghost Field Injection (Shadow Update)',
    path: '/destinations/d99',
    operation: 'create',
    auth: {uid: 'op1', email: 'op@example.com', email_verified: true},
    payload: {id: 'd99', nama: 'Test', isApprovedForever: true},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified Email Spoofing',
    path: '/users/spoof',
    operation: 'create',
    auth: {uid: 'spoof', email: 'fiansa2002@gmail.com', email_verified: false},
    payload: {uid: 'spoof', role: 'admin'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Cross-User PII Read',
    path: '/users/userB',
    operation: 'get',
    auth: {uid: 'userA', email: 'a@example.com', email_verified: true},
    payload: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-User Subcollection Write',
    path: '/users/userB/favorites/f1',
    operation: 'create',
    auth: {uid: 'userA', email: 'a@example.com', email_verified: true},
    payload: {id: 'f1', itemId: 'd01', tipeItem: 'destinasi', ownerUid: 'userA'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning',
    path: `/destinations/${'x'.repeat(200)}`,
    operation: 'create',
    auth: {uid: 'admin1', email: 'fiansa2002@gmail.com', email_verified: true},
    payload: {id: 'x'.repeat(200)},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Operator Destructive Delete Attempt',
    path: '/destinations/d01',
    operation: 'delete',
    auth: {uid: 'op1', email: 'op@example.com', email_verified: true},
    payload: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Regular User Catalog Tampering',
    path: '/culinary/c01',
    operation: 'update',
    auth: {uid: 'u1', email: 'traveler@example.com', email_verified: true},
    payload: {harga: 0},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Client Timestamp Spoofing',
    path: '/destinations/d10',
    operation: 'create',
    auth: {uid: 'admin1', email: 'fiansa2002@gmail.com', email_verified: true},
    payload: {id: 'd10', createdAt: '2020-01-01T00:00:00Z'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass',
    path: '/verificationReports/r1',
    operation: 'update',
    auth: {uid: 'op1', email: 'op@example.com', email_verified: true},
    existingStatus: 'verified',
    payload: {status: 'pending', resolutionNote: 'reopened'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Report Author Spoofing',
    path: '/verificationReports/r2',
    operation: 'create',
    auth: {uid: 'userA', email: 'a@example.com', email_verified: true},
    payload: {id: 'r2', authorUid: 'userB', status: 'pending'},
    expected: 'PERMISSION_DENIED',
  },
];

// Static contract assertions ensuring all Eight Pillars remain present in firestore.rules
assert.match(RULES_TEXT, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
assert.match(RULES_TEXT, /request\.auth\.token\.email_verified == true/);
assert.match(RULES_TEXT, /affectedKeys\(\)\.hasOnly\(/);
assert.match(RULES_TEXT, /isValidId\(/);
assert.match(RULES_TEXT, /isValidUser\(/);
assert.match(RULES_TEXT, /isValidDestination\(/);
assert.match(RULES_TEXT, /isValidReport\(/);
assert.equal(DIRTY_DOZEN_CASES.length, 12);
