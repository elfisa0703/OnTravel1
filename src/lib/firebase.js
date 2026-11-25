import {initializeApp} from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the provisioned named database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: 'select_account'});

export const FIREBASE_CONSOLE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

/** @readonly @enum {string} */
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

/**
 * @typedef {Object} FirestoreErrorInfo
 * @property {string} error
 * @property {string} operationType
 * @property {string|null} path
 * @property {{
 *   userId: string|null|undefined,
 *   email: string|null|undefined,
 *   emailVerified: boolean|null|undefined,
 *   isAnonymous: boolean|null|undefined,
 *   tenantId: string|null|undefined,
 *   providerInfo: Array<{providerId: string|null, displayName: string|null, email: string|null, photoUrl: string|null}>
 * }} authInfo
 */

/** @type {((info: {quotaExceeded: boolean, message: string}) => void)|null} */
let quotaListener = null;

/**
 * Register callback for Firestore quota errors.
 * @param {(info: {quotaExceeded: boolean, message: string}) => void} cb
 */
export function onFirestoreQuotaError(cb) {
  quotaListener = cb;
}

/**
 * Structured Firestore error reporter required across all Firestore try/catch & onSnapshot callbacks.
 * @param {unknown} error
 * @param {string} operationType
 * @param {string|null} path
 * @returns {never}
 */
export function handleFirestoreError(error, operationType, path) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Quota exceeded') && quotaListener) {
    quotaListener({quotaExceeded: true, message});
  }

  /** @type {FirestoreErrorInfo} */
  const errInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Firestore connectivity at startup.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

/**
 * Clamp and sanitize string to blueprint maxLength.
 * @param {unknown} val
 * @param {number} maxLen
 * @param {string} [fallback='']
 * @returns {string}
 */
export function clampString(val, maxLen, fallback = '') {
  const s = String(val ?? '').trim();
  if (!s) return fallback;
  return s.slice(0, maxLen);
}

/**
 * Validate safe https:// URL or return empty string (prevents data: URI or invalid URL writes to Firestore).
 * @param {unknown} val
 * @param {number} [maxLen=800]
 * @returns {string}
 */
export function sanitizeHttpsUrl(val, maxLen = 800) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (/^https:\/\//i.test(s) && s.length <= maxLen) {
    return s;
  }
  return '';
}

/**
 * Ensure document ID matches strict ^[a-zA-Z0-9_\-]+$ and <= 128 chars.
 * @param {string} raw
 * @param {string} [prefix='item']
 * @returns {string}
 */
export function sanitizeId(raw, prefix = 'item') {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  if (cleaned && ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return `${prefix}_${Date.now()}`;
}

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  where,
  writeBatch,
};
