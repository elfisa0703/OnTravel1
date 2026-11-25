import {
  CATEGORIES,
  REGIONS,
  SEED_CULINARY,
  SEED_DESTINATIONS,
  SEED_PACKAGES,
  SEED_STAYS,
} from '../data/seed.js';
import {
  auth,
  clampString,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  googleProvider,
  handleFirestoreError,
  onAuthStateChanged,
  onSnapshot,
  OperationType,
  query,
  sanitizeHttpsUrl,
  sanitizeId,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  where,
  writeBatch,
} from '../lib/firebase.js';
import {todayISO} from '../utils/format.js';

export const BOOTSTRAP_ADMIN_EMAIL = 'fiansa2002@gmail.com';

const DBKEY = 'ontravel_demo_db_v1';
const FAVKEY = 'ontravel_favorites_v1';
const PLANKEY = 'ontravel_itinerary_v1';
const PREFKEY = 'ontravel_preferences_v1';

/**
 * @typedef {'user'|'operator'|'admin'} UserRole
 * @typedef {'guest'|UserRole} EffectiveRole
 * @typedef {'home'|'destinations'|'culinary'|'stays'|'packages'|'planner'|'favorites'|'login'|'operator'|'admin'} ViewId
 * @typedef {'destinations'|'culinary'|'stays'|'packages'} CatalogType
 */

/**
 * @typedef {Object} UserProfileRecord
 * @property {string} uid
 * @property {string} displayName
 * @property {string} email
 * @property {UserRole} role
 * @property {unknown} [createdAt]
 * @property {unknown} [updatedAt]
 */

/**
 * @typedef {Object} VerificationReportRecord
 * @property {string} id
 * @property {'destinations'|'culinary'|'stays'} targetType
 * @property {string} targetId
 * @property {string} targetName
 * @property {string} note
 * @property {'pending'|'in_review'|'verified'|'rejected'} status
 * @property {string} resolutionNote
 * @property {string} authorUid
 * @property {string} authorName
 * @property {string} reviewedByUid
 * @property {unknown} [createdAt]
 * @property {unknown} [updatedAt]
 */

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

/**
 * @typedef {Object} DatabaseState
 * @property {import('../data/seed.js').DestinationItem[]} destinations
 * @property {import('../data/seed.js').CulinaryItem[]} culinary
 * @property {import('../data/seed.js').StayItem[]} stays
 * @property {import('../data/seed.js').PackageItem[]} packages
 */

/**
 * @param {Partial<DatabaseState>|null} [source]
 * @returns {DatabaseState}
 */
function buildNormalizedDB(source = null) {
  const valid =
    source &&
    Array.isArray(source.destinations) &&
    Array.isArray(source.culinary) &&
    Array.isArray(source.stays) &&
    Array.isArray(source.packages);

  /** @type {DatabaseState} */
  const base = valid
    ? /** @type {DatabaseState} */ (source)
    : {
        destinations: structuredClone(SEED_DESTINATIONS),
        culinary: structuredClone(SEED_CULINARY),
        stays: structuredClone(SEED_STAYS),
        packages: structuredClone(SEED_PACKAGES),
      };

  const destSeedMap = new Map(SEED_DESTINATIONS.map((s) => [s.id, s]));
  const culSeedMap = new Map(SEED_CULINARY.map((s) => [s.id, s]));
  const staySeedMap = new Map(SEED_STAYS.map((s) => [s.id, s]));
  const pkgSeedMap = new Map(SEED_PACKAGES.map((s) => [s.id, s]));

  /** @param {string|undefined} url */
  const hasRealPhoto = (url) =>
    Boolean(url && /^https:\/\//i.test(url.trim()));

  base.destinations = base.destinations.map((item) => ({
    ...item,
    imageUrl: hasRealPhoto(item.imageUrl)
      ? item.imageUrl
      : destSeedMap.get(item.id)?.imageUrl || '',
    mapsUrl:
      item.mapsUrl ||
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(item.alamat || `${item.nama}, ${item.wilayah}, Aceh`),
  }));
  base.culinary = base.culinary.map((item) => ({
    ...item,
    imageUrl: hasRealPhoto(item.imageUrl)
      ? item.imageUrl
      : culSeedMap.get(item.id)?.imageUrl || '',
  }));
  base.stays = base.stays.map((item) => ({
    ...item,
    imageUrl: hasRealPhoto(item.imageUrl)
      ? item.imageUrl
      : staySeedMap.get(item.id)?.imageUrl || '',
  }));
  base.packages = base.packages.map((item) => ({
    ...item,
    imageUrl: hasRealPhoto(item.imageUrl)
      ? item.imageUrl
      : pkgSeedMap.get(item.id)?.imageUrl || '',
  }));

  return base;
}

/** @returns {DatabaseState} */
function createInitialDB() {
  /** @type {DatabaseState|null} */
  const stored = readJSON(DBKEY, /** @type {DatabaseState|null} */ (null));
  return buildNormalizedDB(stored);
}

/**
 * @typedef {Object} FavoriteRecord
 * @property {string} id
 * @property {string} itemId
 * @property {'destinasi'|'kuliner'|'akomodasi'} tipeItem
 * @property {string} [ownerUid]
 * @property {string} [tanggalDitambahkan]
 */

/**
 * @typedef {Object} PlanActivity
 * @property {string} id
 * @property {string} itemId
 * @property {number} day
 */

/**
 * @typedef {Object} TripPlan
 * @property {string} id
 * @property {string} namaPerjalanan
 * @property {string} tanggalMulai
 * @property {number} jumlahHari
 * @property {number} jumlahWisatawan
 * @property {PlanActivity[]} daftarAktivitas
 * @property {number} foodPerPersonPerDay
 * @property {number} hotelPerNight
 * @property {number} rooms
 * @property {number} transportBudget
 * @property {number} totalAnggaran
 */

function createGuestPlan() {
  const fallback = {
    id: 'main',
    namaPerjalanan: 'Jelajah Aceh',
    tanggalMulai: todayISO(),
    jumlahHari: 3,
    jumlahWisatawan: 2,
    daftarAktivitas: [],
    foodPerPersonPerDay: 120000,
    hotelPerNight: 350000,
    rooms: 1,
    transportBudget: 250000,
    totalAnggaran: 0,
  };
  const loaded = readJSON(PLANKEY, fallback);
  return {
    ...fallback,
    ...(loaded && typeof loaded === 'object' ? loaded : {}),
    id: 'main',
    daftarAktivitas: Array.isArray(loaded?.daftarAktivitas)
      ? loaded.daftarAktivitas
      : [],
  };
}

export const store = {
  db: createInitialDB(),
  /** @type {Record<CatalogType, boolean>} */
  cloudLoaded: {
    destinations: false,
    culinary: false,
    stays: false,
    packages: false,
  },
  /** @type {FavoriteRecord[]} */
  favorites: readJSON(FAVKEY, []),
  /** @type {TripPlan} */
  plan: createGuestPlan(),
  /** @type {UserProfileRecord[]} */
  usersDirectory: [],
  /** @type {VerificationReportRecord[]} */
  reports: [],
  /** @type {{
   *   status: 'loading'|'authenticated'|'anonymous',
   *   user: {uid: string, displayName: string, email: string, emailVerified: boolean}|null,
   *   realRole: UserRole|null,
   *   previewRole: UserRole|null,
   *   busy: boolean,
   *   error: string|null
   * }} */
  auth: {
    status: 'loading',
    user: null,
    realRole: null,
    previewRole: null,
    busy: false,
    error: null,
  },
  /** @type {{
   *   view: ViewId,
   *   lang: 'id'|'en',
   *   filters: {q: string, region: string, category: string, sort: string},
   *   culinaryQ: string,
   *   culinaryRegion: string,
   *   staysQ: string,
   *   staysRegion: string,
   *   recommend: {interest: string, budget: number},
   *   adminType: 'users'|'reports'|CatalogType,
   *   operatorTab: 'reports'|CatalogType
   * }} */
  ui: {
    view: 'home',
    lang: readJSON(PREFKEY, {lang: 'id'}).lang === 'en' ? 'en' : 'id',
    filters: {q: '', region: '', category: '', sort: 'featured'},
    culinaryQ: '',
    culinaryRegion: '',
    staysQ: '',
    staysRegion: '',
    recommend: {interest: '', budget: 2000000},
    adminType: 'destinations',
    operatorTab: 'reports',
  },
};

/** @type {Array<() => void>} */
let authSubscriptions = [];
/** @type {Array<() => void>} */
let publicSubscriptions = [];
/** @type {() => void} */
let notifyChange = () => {};
/** @type {Promise<void>|null} */
let autoSeedPromise = null;

function clearAuthSubscriptions() {
  authSubscriptions.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore cleanup failures
    }
  });
  authSubscriptions = [];
}

function clearPublicSubscriptions() {
  publicSubscriptions.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore cleanup failures
    }
  });
  publicSubscriptions = [];
}

/**
 * Determine effective UI role. Admin may preview Operator or User Biasa UI on #login.
 * Firestore security rules remain strictly enforced on real server identity.
 * @returns {EffectiveRole}
 */
export function getEffectiveRole() {
  if (store.auth.status !== 'authenticated' || !store.auth.realRole) {
    return 'guest';
  }
  if (store.auth.realRole === 'admin' && store.auth.previewRole) {
    return store.auth.previewRole;
  }
  return store.auth.realRole;
}

/**
 * Check if current user is bootstrapped admin email with verified email.
 * @returns {boolean}
 */
export function isBootstrappedAdminSession() {
  return Boolean(
    store.auth.user?.emailVerified &&
      store.auth.user?.email === BOOTSTRAP_ADMIN_EMAIL,
  );
}

/**
 * Set UI role preview when authenticated as Admin.
 * @param {UserRole|null} role
 */
export function setRolePreview(role) {
  if (store.auth.realRole !== 'admin') return;
  store.auth.previewRole = role === 'admin' ? null : role;
  notifyChange();
}

export function persistDB() {
  writeJSON(DBKEY, store.db);
}

export function persistFavorites() {
  if (!store.auth.user) {
    writeJSON(FAVKEY, store.favorites);
  }
}

export function persistPlan() {
  if (!store.auth.user) {
    writeJSON(PLANKEY, store.plan);
  }
}

export function persistPreferences() {
  writeJSON(PREFKEY, {lang: store.ui.lang});
}

/**
 * Build Firestore payload for Destination matching firebase-blueprint.json.
 * @param {Record<string, any>} raw
 * @param {string} uid
 */
function buildDestinationPayload(raw, uid) {
  const id = sanitizeId(raw.id, 'd');
  const kategori = CATEGORIES.includes(raw.kategori) ? raw.kategori : 'alam';
  const wilayah = clampString(raw.wilayah, 80, REGIONS[0]);
  const fasilitas = Array.isArray(raw.fasilitas)
    ? raw.fasilitas
        .map((s) => clampString(s, 120))
        .filter(Boolean)
        .slice(0, 15)
    : [];
  return {
    id,
    nama: clampString(raw.nama, 140, 'Destinasi Aceh'),
    kategori,
    wilayah: wilayah.length >= 2 ? wilayah : 'Aceh',
    deskripsi: clampString(
      raw.deskripsi,
      800,
      'Informasi destinasi wisata di Aceh.',
    ),
    alamat: clampString(raw.alamat, 240, ''),
    estimasiBiaya: Math.min(100000000, Math.max(0, Number(raw.estimasiBiaya) || 0)),
    fasilitas,
    fasilitasIbadah: clampString(raw.fasilitasIbadah, 500, ''),
    unggulan: Boolean(raw.unggulan),
    verifikasi: clampString(raw.verifikasi, 500, ''),
    imageUrl: sanitizeHttpsUrl(raw.imageUrl, 800),
    mapsUrl: sanitizeHttpsUrl(raw.mapsUrl, 800),
    visibility: 'public',
    updatedByUid: uid,
  };
}

/**
 * Build Firestore payload for Culinary matching firebase-blueprint.json.
 * @param {Record<string, any>} raw
 * @param {string} uid
 */
function buildCulinaryPayload(raw, uid) {
  const id = sanitizeId(raw.id, 'c');
  const wilayah = clampString(raw.wilayah, 80, REGIONS[0]);
  return {
    id,
    nama: clampString(raw.nama, 140, 'Kuliner Aceh'),
    kategori: clampString(raw.kategori, 80, 'Kuliner'),
    wilayah: wilayah.length >= 2 ? wilayah : 'Aceh',
    harga: Math.min(100000000, Math.max(0, Number(raw.harga) || 0)),
    statusSertifikasiHalal: clampString(
      raw.statusSertifikasiHalal,
      80,
      'Belum diverifikasi',
    ),
    sumberVerifikasi: clampString(raw.sumberVerifikasi, 400, ''),
    kontak: clampString(raw.kontak, 160, ''),
    imageUrl: sanitizeHttpsUrl(raw.imageUrl, 800),
    visibility: 'public',
    updatedByUid: uid,
  };
}

/**
 * Build Firestore payload for Stay matching firebase-blueprint.json.
 * @param {Record<string, any>} raw
 * @param {string} uid
 */
function buildStayPayload(raw, uid) {
  const id = sanitizeId(raw.id, 's');
  const wilayah = clampString(raw.wilayah, 80, REGIONS[0]);
  const fasilitas = Array.isArray(raw.fasilitas)
    ? raw.fasilitas
        .map((s) => clampString(s, 120))
        .filter(Boolean)
        .slice(0, 15)
    : [];
  return {
    id,
    nama: clampString(raw.nama, 140, 'Akomodasi Aceh'),
    wilayah: wilayah.length >= 2 ? wilayah : 'Aceh',
    hargaPerMalam: Math.min(
      100000000,
      Math.max(0, Number(raw.hargaPerMalam) || 0),
    ),
    fasilitas,
    fasilitasRamahMuslim: clampString(raw.fasilitasRamahMuslim, 500, ''),
    kontak: clampString(raw.kontak, 160, ''),
    imageUrl: sanitizeHttpsUrl(raw.imageUrl, 800),
    visibility: 'public',
    updatedByUid: uid,
  };
}

/**
 * Build Firestore payload for Package matching firebase-blueprint.json.
 * @param {Record<string, any>} raw
 * @param {string} uid
 */
function buildPackagePayload(raw, uid) {
  const id = sanitizeId(raw.id, 'p');
  const wilayah = clampString(raw.wilayah, 80, REGIONS[0]);
  const daftarDestinasi = Array.isArray(raw.daftarDestinasi)
    ? raw.daftarDestinasi
        .map((s) => sanitizeId(String(s), 'd'))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const minat = Array.isArray(raw.minat)
    ? raw.minat
        .map((s) => clampString(s, 40))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  return {
    id,
    nama: clampString(raw.nama, 140, 'Paket Wisata Aceh'),
    durasi: Math.min(14, Math.max(1, Math.round(Number(raw.durasi) || 1))),
    daftarDestinasi,
    estimasiBiaya: Math.min(
      1000000000,
      Math.max(0, Number(raw.estimasiBiaya) || 0),
    ),
    deskripsi: clampString(
      raw.deskripsi,
      800,
      'Paket perjalanan terkurasi di Aceh.',
    ),
    minat,
    wilayah: wilayah.length >= 2 ? wilayah : 'Aceh',
    imageUrl: sanitizeHttpsUrl(raw.imageUrl, 800),
    visibility: 'public',
    updatedByUid: uid,
  };
}

/**
 * @param {CatalogType} type
 * @param {Record<string, any>} raw
 * @param {string} uid
 */
function buildCatalogPayload(type, raw, uid) {
  switch (type) {
    case 'destinations':
      return buildDestinationPayload(raw, uid);
    case 'culinary':
      return buildCulinaryPayload(raw, uid);
    case 'stays':
      return buildStayPayload(raw, uid);
    case 'packages':
      return buildPackagePayload(raw, uid);
  }
}

/**
 * Apply snapshot records for a catalog collection while keeping local seed images if missing.
 * @param {CatalogType} col
 * @param {Array<Record<string, any>>} docs
 */
function applyCatalogDocs(col, docs) {
  if (!docs.length) return;
  store.cloudLoaded[col] = true;
  const sorted = [...docs].sort((a, b) =>
    String(a.id || '').localeCompare(String(b.id || '')),
  );
  const next = buildNormalizedDB({
    ...store.db,
    [col]: sorted,
  });
  store.db[col] = /** @type {any} */ (next[col]);
  persistDB();
}

/**
 * Load public catalog once (works both for signed-out guests and initial boot).
 */
export async function loadPublicCatalog() {
  /** @type {CatalogType[]} */
  const cols = ['destinations', 'culinary', 'stays', 'packages'];
  await Promise.all(
    cols.map(async (col) => {
      try {
        const q = query(
          collection(db, col),
          where('visibility', '==', 'public'),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          applyCatalogDocs(
            col,
            snap.docs.map((d) => ({id: d.id, ...d.data()})),
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, col);
      }
    }),
  );
  notifyChange();
}

/**
 * Attach live public catalog listeners when user is authenticated.
 */
function subscribePublicCatalog() {
  clearPublicSubscriptions();
  /** @type {CatalogType[]} */
  const cols = ['destinations', 'culinary', 'stays', 'packages'];
  cols.forEach((col) => {
    const q = query(collection(db, col), where('visibility', '==', 'public'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          applyCatalogDocs(
            col,
            snap.docs.map((d) => ({id: d.id, ...d.data()})),
          );
          notifyChange();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, col);
      },
    );
    publicSubscriptions.push(unsub);
  });
}

/**
 * Seed default Aceh catalog records into Firestore (Admin only).
 * Safe to invoke once on initial admin login or manually from Admin toolbar.
 */
export async function seedFirestoreCatalog({overwrite = false} = {}) {
  const user = auth.currentUser;
  if (!user || (store.auth.realRole !== 'admin' && !isBootstrappedAdminSession())) {
    throw new Error('Hanya Admin yang dapat menyinkronkan katalog ke Firestore.');
  }

  /** @type {Array<{col: CatalogType, items: any[]}>} */
  const sources = [
    {col: 'destinations', items: overwrite ? SEED_DESTINATIONS : store.db.destinations},
    {col: 'culinary', items: overwrite ? SEED_CULINARY : store.db.culinary},
    {col: 'stays', items: overwrite ? SEED_STAYS : store.db.stays},
    {col: 'packages', items: overwrite ? SEED_PACKAGES : store.db.packages},
  ];

  const batch = writeBatch(db);
  for (const {col, items} of sources) {
    let existingMap = new Map();
    if (!overwrite) {
      try {
        const snap = await getDocs(
          query(collection(db, col), where('visibility', '==', 'public')),
        );
        existingMap = new Map(snap.docs.map((d) => [d.id, d.data()]));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, col);
      }
    }

    for (const item of items) {
      const id = sanitizeId(item.id, col[0]);
      const payload = buildCatalogPayload(col, {...item, id}, user.uid);
      const ref = doc(db, col, id);
      const prev = existingMap.get(id);
      if (prev && prev.createdAt) {
        batch.set(
          ref,
          {
            ...payload,
            createdAt: prev.createdAt,
            updatedAt: serverTimestamp(),
          },
          {merge: false},
        );
      } else {
        batch.set(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalog-seed');
  }
}

async function ensureCatalogSeededOnAdminLogin() {
  if (autoSeedPromise) return autoSeedPromise;
  autoSeedPromise = (async () => {
    try {
      const destSnap = await getDocs(
        query(collection(db, 'destinations'), where('visibility', '==', 'public')),
      );
      if (destSnap.empty) {
        await seedFirestoreCatalog({overwrite: false});
      }
    } catch {
      // Do not block sign-in if seed check fails; handleFirestoreError handles permission errors cleanly inside seedFirestoreCatalog
    }
  })();
  return autoSeedPromise;
}

/**
 * Subscribe to user-scoped private data (profile, favorites, itinerary, reports, plus admin directory if bootstrapped admin).
 * @param {import('firebase/auth').User} fbUser
 * @param {UserRole} initialRole
 */
function subscribeUserScope(fbUser, initialRole) {
  clearAuthSubscriptions();

  const userDocPath = `users/${fbUser.uid}`;
  const unsubProfile = onSnapshot(
    doc(db, 'users', fbUser.uid),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (
          data.role === 'user' ||
          data.role === 'operator' ||
          data.role === 'admin'
        ) {
          const prevRole = store.auth.realRole;
          store.auth.realRole = data.role;
          if (store.auth.user) {
            store.auth.user.displayName = String(
              data.displayName || store.auth.user.displayName,
            );
          }
          if (prevRole !== data.role) {
            notifyChange();
          }
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, userDocPath);
    },
  );
  authSubscriptions.push(unsubProfile);

  const favPath = `users/${fbUser.uid}/favorites`;
  const favQuery = query(
    collection(db, 'users', fbUser.uid, 'favorites'),
    where('ownerUid', '==', fbUser.uid),
  );
  const unsubFavs = onSnapshot(
    favQuery,
    (snap) => {
      store.favorites = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          itemId: String(data.itemId || ''),
          tipeItem:
            /** @type {'destinasi'|'kuliner'|'akomodasi'} */ (
              data.tipeItem || 'destinasi'
            ),
          ownerUid: String(data.ownerUid || fbUser.uid),
        };
      });
      notifyChange();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, favPath);
    },
  );
  authSubscriptions.push(unsubFavs);

  const planPath = `users/${fbUser.uid}/itineraries`;
  const planQuery = query(
    collection(db, 'users', fbUser.uid, 'itineraries'),
    where('ownerUid', '==', fbUser.uid),
  );
  const unsubPlan = onSnapshot(
    planQuery,
    (snap) => {
      const mainDoc = snap.docs.find((d) => d.id === 'main') || snap.docs[0];
      if (mainDoc) {
        const data = mainDoc.data();
        store.plan = {
          id: mainDoc.id,
          namaPerjalanan: String(data.namaPerjalanan || 'Jelajah Aceh'),
          tanggalMulai: String(data.tanggalMulai || todayISO()),
          jumlahHari: Math.min(5, Math.max(1, Number(data.jumlahHari) || 3)),
          jumlahWisatawan: Math.min(
            30,
            Math.max(1, Number(data.jumlahWisatawan) || 1),
          ),
          daftarAktivitas: Array.isArray(data.daftarAktivitas)
            ? data.daftarAktivitas
            : [],
          foodPerPersonPerDay: Number(data.foodPerPersonPerDay) || 0,
          hotelPerNight: Number(data.hotelPerNight) || 0,
          rooms: Number(data.rooms) || 0,
          transportBudget: Number(data.transportBudget) || 0,
          totalAnggaran: Number(data.totalAnggaran) || 0,
        };
        calculateBudget();
        notifyChange();
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, planPath);
    },
  );
  authSubscriptions.push(unsubPlan);

  // Reports listener: Bootstrapped admin can view full queue; operators/regular users query reports they authored or reviewed
  if (fbUser.emailVerified && fbUser.email === BOOTSTRAP_ADMIN_EMAIL) {
    const unsubAllReports = onSnapshot(
      collection(db, 'verificationReports'),
      (snap) => {
        store.reports = snap.docs
          .map((d) => /** @type {VerificationReportRecord} */ ({id: d.id, ...d.data()}))
          .sort((a, b) => String(b.id).localeCompare(String(a.id)));
        notifyChange();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'verificationReports');
      },
    );
    authSubscriptions.push(unsubAllReports);

    // Bootstrapped admin can list all users to manage roles (user / operator / admin)
    const unsubUsersDir = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        store.usersDirectory = snap.docs
          .map((d) => /** @type {UserProfileRecord} */ (d.data()))
          .sort((a, b) =>
            String(a.displayName || '').localeCompare(String(b.displayName || '')),
          );
        notifyChange();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      },
    );
    authSubscriptions.push(unsubUsersDir);
  } else {
    const ownReportsQuery = query(
      collection(db, 'verificationReports'),
      where('authorUid', '==', fbUser.uid),
    );
    const unsubOwnReports = onSnapshot(
      ownReportsQuery,
      (snap) => {
        const map = new Map(store.reports.map((r) => [r.id, r]));
        snap.docs.forEach((d) => {
          map.set(
            d.id,
            /** @type {VerificationReportRecord} */ ({id: d.id, ...d.data()}),
          );
        });
        store.reports = Array.from(map.values()).sort((a, b) =>
          String(b.id).localeCompare(String(a.id)),
        );
        notifyChange();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'verificationReports');
      },
    );
    authSubscriptions.push(unsubOwnReports);

    if (initialRole === 'operator' || initialRole === 'admin') {
      const reviewedReportsQuery = query(
        collection(db, 'verificationReports'),
        where('reviewedByUid', '==', fbUser.uid),
      );
      const unsubRevReports = onSnapshot(
        reviewedReportsQuery,
        (snap) => {
          const map = new Map(store.reports.map((r) => [r.id, r]));
          snap.docs.forEach((d) => {
            map.set(
              d.id,
              /** @type {VerificationReportRecord} */ ({id: d.id, ...d.data()}),
            );
          });
          store.reports = Array.from(map.values()).sort((a, b) =>
            String(b.id).localeCompare(String(a.id)),
          );
          notifyChange();
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'verificationReports');
        },
      );
      authSubscriptions.push(unsubRevReports);
    }
  }
}

/**
 * Initialize Firebase authentication listener and public catalog loading.
 * @param {() => void} onChange
 */
export function initAuthAndSync(onChange) {
  notifyChange = onChange;
  void loadPublicCatalog().catch(() => {
    // Fallback gracefully to bundled local data when offline or before first seed
  });

  onAuthStateChanged(auth, async (fbUser) => {
    clearAuthSubscriptions();
    clearPublicSubscriptions();

    if (!fbUser) {
      store.auth = {
        status: 'anonymous',
        user: null,
        realRole: null,
        previewRole: null,
        busy: false,
        error: null,
      };
      store.usersDirectory = [];
      store.reports = [];
      store.favorites = readJSON(FAVKEY, []);
      store.plan = createGuestPlan();
      calculateBudget();
      notifyChange();
      return;
    }

    const displayName = clampString(
      fbUser.displayName || fbUser.email?.split('@')[0],
      120,
      'Wisatawan',
    );
    const email = clampString(fbUser.email, 200, 'user@ontravel.local');
    const emailVerified = Boolean(fbUser.emailVerified);

    store.auth = {
      status: 'authenticated',
      user: {
        uid: fbUser.uid,
        displayName,
        email,
        emailVerified,
      },
      realRole: emailVerified && email === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'user',
      previewRole: null,
      busy: false,
      error: null,
    };

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      /** @type {UserRole} */
      let resolvedRole =
        emailVerified && email === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'user';

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid: fbUser.uid,
            displayName,
            email,
            role: resolvedRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (writeErr) {
          handleFirestoreError(
            writeErr,
            OperationType.CREATE,
            `users/${fbUser.uid}`,
          );
        }
      } else {
        const existingData = userSnap.data();
        if (
          existingData.role === 'admin' ||
          existingData.role === 'operator' ||
          existingData.role === 'user'
        ) {
          resolvedRole = existingData.role;
        }
        if (
          emailVerified &&
          email === BOOTSTRAP_ADMIN_EMAIL &&
          resolvedRole !== 'admin'
        ) {
          try {
            await updateDoc(userRef, {
              role: 'admin',
              updatedAt: serverTimestamp(),
            });
            resolvedRole = 'admin';
          } catch (updErr) {
            handleFirestoreError(
              updErr,
              OperationType.UPDATE,
              `users/${fbUser.uid}`,
            );
          }
        }
      }

      store.auth.realRole = resolvedRole;
      subscribePublicCatalog();
      subscribeUserScope(fbUser, resolvedRole);

      if (resolvedRole === 'admin') {
        void ensureCatalogSeededOnAdminLogin();
      }
      notifyChange();
    } catch (error) {
      store.auth.error =
        error instanceof Error ? error.message : 'Gagal memuat profil akun.';
      notifyChange();
    }
  });
}

/**
 * Sign in via Google Popup (only provider enabled by ProvisionFirebase).
 */
export async function loginWithGoogle() {
  store.auth.busy = true;
  store.auth.error = null;
  notifyChange();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : '';
    if (code === 'auth/popup-closed-by-user') {
      store.auth.error = 'Jendela masuk Google ditutup sebelum selesai.';
    } else if (code === 'auth/popup-blocked') {
      store.auth.error =
        'Popup masuk diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.';
    } else {
      store.auth.error =
        error instanceof Error ? error.message : 'Autentikasi gagal.';
    }
    throw error;
  } finally {
    store.auth.busy = false;
    notifyChange();
  }
}

/**
 * Sign out active Firebase user and clear role state.
 */
export async function logoutUser() {
  store.auth.busy = true;
  notifyChange();
  try {
    await signOut(auth);
  } finally {
    store.auth.busy = false;
    notifyChange();
  }
}

/**
 * Admin-only: assign a role ('user' | 'operator' | 'admin') to an existing user.
 * @param {string} targetUid
 * @param {UserRole} newRole
 */
export async function updateUserRole(targetUid, newRole) {
  if (store.auth.realRole !== 'admin' && !isBootstrappedAdminSession()) {
    throw new Error('Hanya Admin yang dapat mengubah peran pengguna.');
  }
  if (!['user', 'operator', 'admin'].includes(newRole)) {
    throw new Error('Peran tidak valid.');
  }
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Save or create a catalog item in Firestore (Operator / Admin) + update local store.
 * @param {CatalogType} type
 * @param {string} id
 * @param {Record<string, any>} rawRecord
 * @param {boolean} isCreate
 */
export async function saveCatalogRecord(type, id, rawRecord, isCreate) {
  const user = auth.currentUser;
  const list = /** @type {any[]} */ (store.db[type]);
  const cleanId = sanitizeId(id, type[0]);
  const merged = {...rawRecord, id: cleanId};

  // Update in-memory store immediately
  const idx = list.findIndex((item) => item.id === cleanId);
  if (idx >= 0) {
    list[idx] = {...list[idx], ...merged};
  } else {
    list.push(merged);
  }
  persistDB();

  if (
    !user ||
    (store.auth.realRole !== 'operator' &&
      store.auth.realRole !== 'admin' &&
      !isBootstrappedAdminSession())
  ) {
    return;
  }

  const payload = buildCatalogPayload(type, merged, user.uid);
  const path = `${type}/${cleanId}`;
  const ref = doc(db, type, cleanId);

  try {
    const snap = await getDoc(ref);
    if (snap.exists() && !isCreate) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else if (snap.exists()) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isCreate ? OperationType.CREATE : OperationType.UPDATE,
      path,
    );
  }
}

/**
 * Delete a catalog item in Firestore (Admin only) + local store.
 * @param {CatalogType} type
 * @param {string} id
 */
export async function deleteCatalogRecord(type, id) {
  const user = auth.currentUser;
  store.db[type] = /** @type {any} */ (
    /** @type {any[]} */ (store.db[type]).filter((item) => item.id !== id)
  );
  persistDB();

  if (!user || (store.auth.realRole !== 'admin' && !isBootstrappedAdminSession())) {
    return;
  }

  const path = `${type}/${id}`;
  try {
    await deleteDoc(doc(db, type, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Submit a field verification or halal update report (Signed-in verified users).
 * @param {{targetType: 'destinations'|'culinary'|'stays', targetId: string, targetName: string, note: string}} input
 */
export async function submitVerificationReport(input) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Silakan masuk terlebih dahulu untuk mengirim laporan.');
  }
  const id = sanitizeId(`rep_${Date.now()}`, 'rep');
  const cleanNote = clampString(input.note, 600);
  if (cleanNote.length < 5) {
    throw new Error('Catatan laporan minimal 5 karakter.');
  }
  const path = `verificationReports/${id}`;
  const payload = {
    id,
    targetType: input.targetType,
    targetId: sanitizeId(input.targetId, 'item'),
    targetName: clampString(input.targetName, 140, 'Item'),
    note: cleanNote,
    status: 'pending',
    resolutionNote: '',
    authorUid: user.uid,
    authorName: clampString(
      store.auth.user?.displayName || user.displayName || 'Wisatawan',
      120,
      'Wisatawan',
    ),
    reviewedByUid: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'verificationReports', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Review / update a verification report status (Operator / Admin).
 * @param {string} reportId
 * @param {'in_review'|'verified'|'rejected'} status
 * @param {string} resolutionNote
 */
export async function reviewVerificationReport(reportId, status, resolutionNote) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Autentikasi diperlukan.');
  }
  const path = `verificationReports/${reportId}`;
  try {
    await updateDoc(doc(db, 'verificationReports', reportId), {
      status,
      resolutionNote: clampString(resolutionNote, 400, ''),
      reviewedByUid: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a verification report (Admin only).
 * @param {string} reportId
 */
export async function deleteVerificationReport(reportId) {
  const path = `verificationReports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'verificationReports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Persist current store.plan to Firestore when authenticated, or localStorage when guest.
 */
export async function savePlanToCloudOrLocal() {
  calculateBudget();
  const user = auth.currentUser;
  if (!user) {
    persistPlan();
    return;
  }

  const planId = 'main';
  const path = `users/${user.uid}/itineraries/${planId}`;
  const ref = doc(db, 'users', user.uid, 'itineraries', planId);

  const activities = (store.plan.daftarAktivitas || [])
    .slice(0, 30)
    .map((act, idx) => ({
      id: sanitizeId(act.id || `act_${idx}`, 'act'),
      itemId: sanitizeId(act.itemId, 'd'),
      day: Math.min(5, Math.max(1, Math.round(Number(act.day) || 1))),
    }));

  const body = {
    id: planId,
    ownerUid: user.uid,
    namaPerjalanan: clampString(store.plan.namaPerjalanan, 160, 'Jelajah Aceh'),
    tanggalMulai: clampString(store.plan.tanggalMulai, 20, todayISO()),
    jumlahHari: Math.min(5, Math.max(1, Math.round(Number(store.plan.jumlahHari) || 1))),
    jumlahWisatawan: Math.min(
      30,
      Math.max(1, Math.round(Number(store.plan.jumlahWisatawan) || 1)),
    ),
    daftarAktivitas: activities,
    foodPerPersonPerDay: Math.min(
      100000000,
      Math.max(0, Number(store.plan.foodPerPersonPerDay) || 0),
    ),
    hotelPerNight: Math.min(
      100000000,
      Math.max(0, Number(store.plan.hotelPerNight) || 0),
    ),
    rooms: Math.min(20, Math.max(0, Math.round(Number(store.plan.rooms) || 0))),
    transportBudget: Math.min(
      1000000000,
      Math.max(0, Number(store.plan.transportBudget) || 0),
    ),
    totalAnggaran: Math.min(
      10000000000,
      Math.max(0, Number(store.plan.totalAnggaran) || 0),
    ),
  };

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        namaPerjalanan: body.namaPerjalanan,
        tanggalMulai: body.tanggalMulai,
        jumlahHari: body.jumlahHari,
        jumlahWisatawan: body.jumlahWisatawan,
        daftarAktivitas: body.daftarAktivitas,
        foodPerPersonPerDay: body.foodPerPersonPerDay,
        hotelPerNight: body.hotelPerNight,
        rooms: body.rooms,
        transportBudget: body.transportBudget,
        totalAnggaran: body.totalAnggaran,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Look up destination by ID.
 * @param {string} id
 */
export function getDestinationById(id) {
  return store.db.destinations.find((d) => d.id === id);
}

/**
 * Check if an item is favorited.
 * @param {'destinasi'|'kuliner'|'akomodasi'} type
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(type, id) {
  return store.favorites.some((f) => f.tipeItem === type && f.itemId === id);
}

/**
 * Toggle favorite status for an item (syncs to Firestore when signed in, else localStorage).
 * @param {'destinasi'|'kuliner'|'akomodasi'} type
 * @param {string} id
 * @returns {boolean} true if added, false if removed
 */
export function toggleFavorite(type, id) {
  const exists = isFavorite(type, id);
  const favDocId = sanitizeId(`fav_${type}_${id}`, 'fav');
  const user = auth.currentUser;

  if (exists) {
    const existingRec = store.favorites.find(
      (f) => f.tipeItem === type && f.itemId === id,
    );
    store.favorites = store.favorites.filter(
      (f) => !(f.tipeItem === type && f.itemId === id),
    );
    if (user) {
      const targetDocId = existingRec?.id || favDocId;
      void deleteDoc(
        doc(db, 'users', user.uid, 'favorites', targetDocId),
      ).catch((err) => {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `users/${user.uid}/favorites/${targetDocId}`,
        );
      });
    }
  } else {
    store.favorites.push({
      id: favDocId,
      itemId: id,
      tipeItem: type,
      ownerUid: user?.uid,
      tanggalDitambahkan: new Date().toISOString(),
    });
    if (user) {
      void setDoc(doc(db, 'users', user.uid, 'favorites', favDocId), {
        id: favDocId,
        itemId: sanitizeId(id, 'item'),
        tipeItem: type,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `users/${user.uid}/favorites/${favDocId}`,
        );
      });
    }
  }

  persistFavorites();
  return !exists;
}

/**
 * Compute detailed budget breakdown and sync store.plan.totalAnggaran.
 */
export function calculateBudget() {
  const travellers = Math.max(1, Number(store.plan.jumlahWisatawan) || 1);
  const days = Math.min(5, Math.max(1, Number(store.plan.jumlahHari) || 1));
  const rooms = Math.max(0, Number(store.plan.rooms) || 0);

  const dest =
    store.plan.daftarAktivitas.reduce((sum, act) => {
      const destItem = getDestinationById(act.itemId);
      return sum + (Number(destItem?.estimasiBiaya) || 0);
    }, 0) * travellers;

  const food =
    Math.max(0, Number(store.plan.foodPerPersonPerDay) || 0) *
    travellers *
    days;
  const stay =
    Math.max(0, Number(store.plan.hotelPerNight) || 0) *
    rooms *
    Math.max(0, days - 1);
  const transport = Math.max(0, Number(store.plan.transportBudget) || 0);
  const total = dest + food + stay + transport;

  store.plan.totalAnggaran = total;
  return {dest, food, stay, transport, total};
}

/**
 * Restore all catalog tables to seed defaults locally (and sync to Firestore if Admin).
 */
export async function resetDemoDatabase() {
  store.db = buildNormalizedDB(null);
  persistDB();
  if (
    auth.currentUser &&
    (store.auth.realRole === 'admin' || isBootstrappedAdminSession())
  ) {
    await seedFirestoreCatalog({overwrite: true});
  }
}
