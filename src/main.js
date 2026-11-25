import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import {
  closeModal,
  executePendingConfirm,
  handleAdminFormSubmit,
  handleReportFormSubmit,
  openAdminFormModal,
  openConfirmModal,
  openContactModal,
  openDetailModal,
  openReportModal,
} from './components/modals.js';
import {roleLabel, showToast, t} from './components/ui.js';
import {I18N} from './data/i18n.js';
import {REGIONS} from './data/seed.js';
import {
  FIREBASE_CONSOLE_UPGRADE_URL,
  onFirestoreQuotaError,
} from './lib/firebase.js';
import {
  calculateBudget,
  deleteCatalogRecord,
  deleteVerificationReport,
  getDestinationById,
  getEffectiveRole,
  initAuthAndSync,
  loginWithGoogle,
  logoutUser,
  persistPreferences,
  resetDemoDatabase,
  reviewVerificationReport,
  savePlanToCloudOrLocal,
  seedFirestoreCatalog,
  setRolePreview,
  store,
  toggleFavorite,
  updateUserRole,
} from './state/store.js';
import {downloadJSON, todayISO} from './utils/format.js';
import {
  focusRegionOnMap,
  installGmpQuotaHooks,
  mountAcehMap,
} from './utils/maps.js';
import {renderAdminView} from './views/admin.js';
import {renderCulinaryResults, renderCulinaryView} from './views/culinary.js';
import {
  renderDestinationResults,
  renderDestinationsView,
} from './views/destinations.js';
import {renderFavoritesView} from './views/favorites.js';
import {renderHomeView} from './views/home.js';
import {renderLoginView} from './views/login.js';
import {renderOperatorView} from './views/operator.js';
import {renderPackageResults, renderPackagesView} from './views/packages.js';
import {
  renderPlannerBudgetSummary,
  renderPlannerDayOptions,
  renderPlannerView,
} from './views/planner.js';
import {renderStaysResults, renderStaysView} from './views/stays.js';

// Early module-root Google Maps Platform quota & auth failure hooks
installGmpQuotaHooks();

let gmpQuotaExceeded = false;
let firestoreQuotaExceeded = false;
let planSyncTimer = 0;

function renderQuotaBanners() {
  const root = document.getElementById('gmpQuotaRoot');
  if (!root) return;
  const parts = [];
  if (gmpQuotaExceeded) {
    parts.push(`<div class="gmp-quota-banner" role="alert">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
        >maps developer site</a>
        for instructions to update your account.
      </span>
    </div>`);
  }
  if (firestoreQuotaExceeded) {
    parts.push(`<div class="gmp-quota-banner" role="alert">
      <span>
        Firestore daily free-tier quota exceeded. Quota resets tomorrow, or upgrade in the
        <a
          href="${FIREBASE_CONSOLE_UPGRADE_URL}"
          target="_blank"
          rel="noopener noreferrer"
        >Firebase Console</a>.
      </span>
    </div>`);
  }
  root.innerHTML = parts.join('');
}

window.addEventListener('gmp-quota-exceeded', () => {
  if (!gmpQuotaExceeded) {
    gmpQuotaExceeded = true;
    renderQuotaBanners();
  }
});

onFirestoreQuotaError(() => {
  if (!firestoreQuotaExceeded) {
    firestoreQuotaExceeded = true;
    renderQuotaBanners();
  }
});

/** @type {Set<import('./state/store.js').ViewId>} */
const VALID_VIEWS = new Set([
  'home',
  'destinations',
  'culinary',
  'stays',
  'packages',
  'planner',
  'favorites',
  'login',
  'operator',
  'admin',
]);

/**
 * Read active view from URL hash if valid.
 * @returns {import('./state/store.js').ViewId}
 */
function parseViewFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (VALID_VIEWS.has(/** @type {any} */ (hash))) {
    return /** @type {import('./state/store.js').ViewId} */ (hash);
  }
  return 'home';
}

function syncRoleNavigation() {
  const role = getEffectiveRole();
  const operatorBtn = document.getElementById('navOperatorBtn');
  const adminBtn = document.getElementById('navAdminBtn');
  const authBtn = document.getElementById('authNavBtn');

  if (operatorBtn) {
    operatorBtn.hidden = role !== 'operator' && role !== 'admin';
  }
  if (adminBtn) {
    adminBtn.hidden = role !== 'admin';
  }
  if (authBtn) {
    if (store.auth.status === 'authenticated' && store.auth.user) {
      const firstName = store.auth.user.displayName.split(/\s+/)[0] || '';
      authBtn.textContent = `${roleLabel(role)} · ${firstName}`;
      authBtn.classList.add('is-signed-in');
    } else {
      authBtn.textContent = t('navLogin');
      authBtn.classList.remove('is-signed-in');
    }
  }
}

function syncStaticTranslations() {
  document.documentElement.lang = store.ui.lang;
  const langBtn = document.getElementById('langBtn');
  if (langBtn) {
    langBtn.textContent = store.ui.lang === 'id' ? 'EN' : 'ID';
  }
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el instanceof HTMLElement && el.dataset.i18n) {
      const text = I18N[store.ui.lang]?.[el.dataset.i18n];
      if (text) el.textContent = text;
    }
  });
  syncRoleNavigation();
}

function closeMobileNav() {
  const navlinks = document.getElementById('navlinks');
  const toggle = document.getElementById('menuToggle');
  navlinks?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}

function schedulePlanPersist() {
  window.clearTimeout(planSyncTimer);
  planSyncTimer = window.setTimeout(() => {
    void savePlanToCloudOrLocal().catch(() => {
      // Structured error logged in handleFirestoreError
    });
  }, 600);
}

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  let html = '';
  switch (store.ui.view) {
    case 'home':
      html = renderHomeView();
      break;
    case 'destinations':
      html = renderDestinationsView();
      break;
    case 'culinary':
      html = renderCulinaryView();
      break;
    case 'stays':
      html = renderStaysView();
      break;
    case 'packages':
      html = renderPackagesView();
      break;
    case 'planner':
      html = renderPlannerView();
      break;
    case 'favorites':
      html = renderFavoritesView();
      break;
    case 'login':
      html = renderLoginView();
      break;
    case 'operator':
      html = renderOperatorView();
      break;
    case 'admin':
      html = renderAdminView();
      break;
    default:
      store.ui.view = 'home';
      html = renderHomeView();
  }

  app.innerHTML = html;

  document.querySelectorAll('[data-view]').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.classList.toggle('active', el.dataset.view === store.ui.view);
    }
  });

  closeMobileNav();
  syncStaticTranslations();

  if (store.ui.view === 'home') {
    const mapContainer = document.getElementById('acehMap');
    if (mapContainer instanceof HTMLElement) {
      void mountAcehMap(mapContainer, REGIONS, store.ui.lang);
    }
  }
}

/**
 * Navigate to a view and synchronize URL hash.
 * @param {import('./state/store.js').ViewId} view
 * @param {boolean} [updateHash=true]
 */
function navigateTo(view, updateHash = true) {
  store.ui.view = VALID_VIEWS.has(view) ? view : 'home';
  if (updateHash && window.location.hash !== `#${store.ui.view}`) {
    window.history.pushState(null, '', `#${store.ui.view}`);
  }
  renderApp();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

/**
 * Add a destination to the trip planner and open planner view.
 * @param {string} id
 */
function addDestinationToPlan(id) {
  if (!getDestinationById(id)) {
    showToast(t('notFound'));
    return;
  }
  if (!store.plan.daftarAktivitas.some((a) => a.itemId === id)) {
    store.plan.daftarAktivitas.push({
      id: `a${Date.now()}`,
      itemId: id,
      day: 1,
    });
  }
  calculateBudget();
  void savePlanToCloudOrLocal().catch(() => {});
  showToast(t('addedPlan'));
  closeModal();
  navigateTo('planner');
}

/**
 * Load a curated package into the trip planner.
 * @param {string} id
 */
function loadPackageIntoPlan(id) {
  const pkg = store.db.packages.find((p) => p.id === id);
  if (!pkg) {
    showToast(t('notFound'));
    return;
  }
  store.plan.namaPerjalanan = pkg.nama;
  store.plan.jumlahHari = Math.min(5, Math.max(1, Number(pkg.durasi) || 1));
  store.plan.daftarAktivitas = [];
  (pkg.daftarDestinasi || []).forEach((destId, idx) => {
    if (getDestinationById(destId)) {
      store.plan.daftarAktivitas.push({
        id: `a${Date.now()}${idx}`,
        itemId: destId,
        day: Math.min(store.plan.jumlahHari, idx + 1),
      });
    }
  });
  calculateBudget();
  void savePlanToCloudOrLocal().catch(() => {});
  showToast(t('addedPlan'));
  navigateTo('planner');
}

async function savePlanFromDom() {
  const nameEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planName')
  );
  const dateEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planDate')
  );
  const daysEl = /** @type {HTMLSelectElement|null} */ (
    document.getElementById('planDays')
  );
  const travEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planTravellers')
  );
  const roomsEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planRooms')
  );
  const foodEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planFood')
  );
  const hotelEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planHotel')
  );
  const transportEl = /** @type {HTMLInputElement|null} */ (
    document.getElementById('planTransport')
  );

  store.plan.namaPerjalanan = nameEl?.value.trim() || 'Jelajah Aceh';
  store.plan.tanggalMulai = dateEl?.value || todayISO();
  store.plan.jumlahHari = Math.min(
    5,
    Math.max(1, Number(daysEl?.value) || 1),
  );
  store.plan.jumlahWisatawan = Math.min(
    30,
    Math.max(1, Number(travEl?.value) || 1),
  );
  store.plan.rooms = Math.min(20, Math.max(0, Number(roomsEl?.value) || 0));
  store.plan.foodPerPersonPerDay = Math.max(0, Number(foodEl?.value) || 0);
  store.plan.hotelPerNight = Math.max(0, Number(hotelEl?.value) || 0);
  store.plan.transportBudget = Math.max(0, Number(transportEl?.value) || 0);
  store.plan.daftarAktivitas = store.plan.daftarAktivitas.map((act) => ({
    ...act,
    day: Math.min(store.plan.jumlahHari, Math.max(1, Number(act.day) || 1)),
  }));

  calculateBudget();
  try {
    await savePlanToCloudOrLocal();
    showToast(t('savedPlan'));
  } catch {
    showToast(t('notFound'));
  }
  renderApp();
}

/**
 * Select region from map dot or pill button and open destinations.
 * @param {string} region
 */
function selectRegionAndBrowse(region) {
  store.ui.filters.region = region;
  store.ui.filters.q = '';
  store.ui.filters.category = '';
  navigateTo('destinations');
}

// Resilient image fallback handler (capture phase because img error does not bubble)
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (
      target instanceof HTMLImageElement &&
      target.dataset.fallbackTitle &&
      target.parentElement
    ) {
      const fallback = document.createElement('div');
      fallback.className = 'card-image-fallback';
      fallback.textContent = target.dataset.fallbackTitle;
      target.replaceWith(fallback);
    }
  },
  true,
);

// Delegated click interactions
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const viewTrigger = target.closest('[data-view]');
  if (viewTrigger instanceof HTMLElement && viewTrigger.dataset.view) {
    event.preventDefault();
    navigateTo(
      /** @type {import('./state/store.js').ViewId} */ (
        viewTrigger.dataset.view
      ),
    );
    return;
  }

  const regionTrigger = target.closest('[data-region]');
  if (regionTrigger instanceof Element) {
    const region = regionTrigger.getAttribute('data-region');
    if (region) {
      selectRegionAndBrowse(region);
      return;
    }
  }

  const actionEl = target.closest('[data-action]');
  if (!(actionEl instanceof HTMLElement)) return;
  const action = actionEl.dataset.action;

  switch (action) {
    case 'toggle-lang': {
      store.ui.lang = store.ui.lang === 'id' ? 'en' : 'id';
      persistPreferences();
      renderApp();
      break;
    }
    case 'menu': {
      const navlinks = document.getElementById('navlinks');
      const isOpen = navlinks?.classList.toggle('open');
      actionEl.setAttribute('aria-expanded', String(Boolean(isOpen)));
      break;
    }
    case 'google-login': {
      void loginWithGoogle()
        .then(() => showToast(t('signedInToast')))
        .catch(() => {
          // Error is displayed inside Login card
        });
      break;
    }
    case 'logout': {
      void logoutUser().then(() => {
        showToast(t('signedOut'));
        renderApp();
      });
      break;
    }
    case 'preview-role': {
      const nextRole = /** @type {import('./state/store.js').UserRole} */ (
        actionEl.dataset.role
      );
      if (nextRole) {
        setRolePreview(nextRole);
      }
      break;
    }
    case 'favorite': {
      const type = /** @type {'destinasi'|'kuliner'|'akomodasi'} */ (
        actionEl.dataset.type
      );
      const id = actionEl.dataset.id || '';
      const added = toggleFavorite(type, id);
      showToast(added ? t('addedFavorite') : t('removedFavorite'));
      renderApp();
      break;
    }
    case 'detail': {
      if (actionEl.dataset.id) {
        openDetailModal(actionEl.dataset.id);
      }
      break;
    }
    case 'open-report': {
      const targetType = /** @type {'destinations'|'culinary'|'stays'} */ (
        actionEl.dataset.targetType
      );
      const targetId = actionEl.dataset.targetId || '';
      const targetName = actionEl.dataset.targetName || '';
      if (targetType && targetId) {
        openReportModal(targetType, targetId, targetName);
      }
      break;
    }
    case 'close-modal': {
      closeModal();
      break;
    }
    case 'backdrop-close': {
      if (target === actionEl) {
        closeModal();
      }
      break;
    }
    case 'confirm-modal-ok': {
      executePendingConfirm();
      break;
    }
    case 'contact': {
      openContactModal(actionEl.dataset.name || '');
      break;
    }
    case 'add-itinerary': {
      if (actionEl.dataset.id) {
        addDestinationToPlan(actionEl.dataset.id);
      }
      break;
    }
    case 'reset-dest-filters': {
      store.ui.filters = {q: '', region: '', category: '', sort: 'featured'};
      renderApp();
      break;
    }
    case 'reset-culinary-filters': {
      store.ui.culinaryQ = '';
      store.ui.culinaryRegion = '';
      renderApp();
      break;
    }
    case 'reset-stays-filters': {
      store.ui.staysQ = '';
      store.ui.staysRegion = '';
      renderApp();
      break;
    }
    case 'add-activity': {
      const destSelect = /** @type {HTMLSelectElement|null} */ (
        document.getElementById('planDest')
      );
      const daySelect = /** @type {HTMLSelectElement|null} */ (
        document.getElementById('planDay')
      );
      const destId = destSelect?.value || '';
      if (!destId) {
        showToast(t('selectDest'));
        return;
      }
      const day = Number(daySelect?.value) || 1;
      if (
        store.plan.daftarAktivitas.some(
          (act) => act.itemId === destId && act.day === day,
        )
      ) {
        showToast(t('activityExists'));
        return;
      }
      store.plan.daftarAktivitas.push({
        id: `a${Date.now()}`,
        itemId: destId,
        day,
      });
      calculateBudget();
      void savePlanToCloudOrLocal().catch(() => {});
      showToast(t('addedPlan'));
      renderApp();
      break;
    }
    case 'remove-activity': {
      const idx = Number(actionEl.dataset.index);
      if (!Number.isNaN(idx)) {
        store.plan.daftarAktivitas.splice(idx, 1);
        calculateBudget();
        void savePlanToCloudOrLocal().catch(() => {});
        renderApp();
      }
      break;
    }
    case 'clear-activities': {
      store.plan.daftarAktivitas = [];
      calculateBudget();
      void savePlanToCloudOrLocal().catch(() => {});
      showToast(t('clearedPlan'));
      renderApp();
      break;
    }
    case 'save-plan': {
      void savePlanFromDom();
      break;
    }
    case 'export-plan': {
      const budget = calculateBudget();
      downloadJSON(`ontravel-itinerary-${todayISO()}.json`, {
        ...store.plan,
        budgetBreakdown: budget,
      });
      showToast(t('exported'));
      break;
    }
    case 'recommend': {
      const interestEl = /** @type {HTMLSelectElement|null} */ (
        document.getElementById('interestSelect')
      );
      const budgetEl = /** @type {HTMLInputElement|null} */ (
        document.getElementById('budgetSelect')
      );
      store.ui.recommend.interest = interestEl?.value || '';
      store.ui.recommend.budget = Math.max(0, Number(budgetEl?.value) || 0);
      const box = document.getElementById('packageResults');
      if (box) box.innerHTML = renderPackageResults();
      break;
    }
    case 'add-package': {
      if (actionEl.dataset.id) {
        loadPackageIntoPlan(actionEl.dataset.id);
      }
      break;
    }
    case 'operator-tab': {
      const tabType = /** @type {'reports'|import('./state/store.js').CatalogType} */ (
        actionEl.dataset.type
      );
      if (tabType) {
        store.ui.operatorTab = tabType;
        renderApp();
      }
      break;
    }
    case 'admin-tab': {
      const tabType = /** @type {'users'|'reports'|import('./state/store.js').CatalogType} */ (
        actionEl.dataset.type
      );
      if (tabType) {
        store.ui.adminType = tabType;
        renderApp();
      }
      break;
    }
    case 'new': {
      const entityType = /** @type {import('./state/store.js').CatalogType} */ (
        actionEl.dataset.type
      );
      if (entityType) openAdminFormModal(entityType);
      break;
    }
    case 'edit': {
      const entityType = /** @type {import('./state/store.js').CatalogType} */ (
        actionEl.dataset.type
      );
      if (entityType && actionEl.dataset.id) {
        openAdminFormModal(entityType, actionEl.dataset.id);
      }
      break;
    }
    case 'delete': {
      const entityType = /** @type {import('./state/store.js').CatalogType} */ (
        actionEl.dataset.type
      );
      const id = actionEl.dataset.id;
      if (!entityType || !id) return;
      openConfirmModal({
        message: t('deleteConfirm'),
        confirmLabel: t('delete'),
        danger: true,
        onConfirm: () => {
          void deleteCatalogRecord(entityType, id).then(() => {
            showToast(t('deleted'));
            renderApp();
          });
        },
      });
      break;
    }
    case 'review-report': {
      const reportId = actionEl.dataset.id;
      if (!reportId) return;
      const statusEl = /** @type {HTMLSelectElement|null} */ (
        document.getElementById(`rep_status_${reportId}`)
      );
      const noteEl = /** @type {HTMLInputElement|null} */ (
        document.getElementById(`rep_note_${reportId}`)
      );
      const status = /** @type {'in_review'|'verified'|'rejected'} */ (
        statusEl?.value || 'in_review'
      );
      const note = noteEl?.value.trim() || '';
      void reviewVerificationReport(reportId, status, note)
        .then(() => {
          showToast(t('reportUpdated'));
          renderApp();
        })
        .catch((err) => {
          showToast(err instanceof Error ? err.message : t('notFound'));
        });
      break;
    }
    case 'delete-report': {
      const reportId = actionEl.dataset.id;
      if (!reportId) return;
      openConfirmModal({
        message: t('deleteConfirm'),
        confirmLabel: t('delete'),
        danger: true,
        onConfirm: () => {
          void deleteVerificationReport(reportId).then(() => {
            showToast(t('deleted'));
            renderApp();
          });
        },
      });
      break;
    }
    case 'assign-role': {
      const targetUid = actionEl.dataset.uid;
      if (!targetUid) return;
      const roleEl = /** @type {HTMLSelectElement|null} */ (
        document.getElementById(`user_role_${targetUid}`)
      );
      const nextRole = /** @type {import('./state/store.js').UserRole} */ (
        roleEl?.value || 'user'
      );
      openConfirmModal({
        message: `${t('assignRole')}: ${roleLabel(nextRole)}?`,
        confirmLabel: t('confirm'),
        onConfirm: () => {
          void updateUserRole(targetUid, nextRole)
            .then(() => {
              showToast(t('roleSaved'));
              renderApp();
            })
            .catch((err) => {
              showToast(err instanceof Error ? err.message : t('notFound'));
            });
        },
      });
      break;
    }
    case 'seed-firestore': {
      void seedFirestoreCatalog({overwrite: false})
        .then(() => {
          showToast(t('syncDone'));
          renderApp();
        })
        .catch((err) => {
          showToast(err instanceof Error ? err.message : t('notFound'));
        });
      break;
    }
    case 'reset-db': {
      openConfirmModal({
        message: t('resetConfirm'),
        confirmLabel: t('resetDemo'),
        danger: true,
        onConfirm: () => {
          void resetDemoDatabase().then(() => {
            showToast(t('resetDone'));
            renderApp();
          });
        },
      });
      break;
    }
    case 'export-db': {
      downloadJSON(`ontravel-content-${todayISO()}.json`, store.db);
      showToast(t('exported'));
      break;
    }
  }
});

// Delegated live search & planner budget inputs
document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }

  const liveSearch = target.dataset.liveSearch;
  if (liveSearch === 'dest') {
    store.ui.filters.q = target.value;
    const box = document.getElementById('destResults');
    if (box) box.innerHTML = renderDestinationResults();
    return;
  }
  if (liveSearch === 'culinary') {
    store.ui.culinaryQ = target.value;
    const box = document.getElementById('culinaryResults');
    if (box) box.innerHTML = renderCulinaryResults();
    return;
  }
  if (liveSearch === 'stays') {
    store.ui.staysQ = target.value;
    const box = document.getElementById('staysResults');
    if (box) box.innerHTML = renderStaysResults();
    return;
  }

  const planField = target.dataset.planLive;
  if (planField) {
    if (planField === 'namaPerjalanan' || planField === 'tanggalMulai') {
      store.plan[planField] = target.value;
    } else if (planField === 'jumlahHari') {
      store.plan.jumlahHari = Math.min(
        5,
        Math.max(1, Number(target.value) || 1),
      );
      const daySelect = document.getElementById('planDay');
      if (daySelect) daySelect.innerHTML = renderPlannerDayOptions();
    } else if (planField === 'jumlahWisatawan') {
      store.plan.jumlahWisatawan = Math.min(
        30,
        Math.max(1, Number(target.value) || 1),
      );
    } else if (planField === 'rooms') {
      store.plan.rooms = Math.min(20, Math.max(0, Number(target.value) || 0));
    } else if (
      planField === 'foodPerPersonPerDay' ||
      planField === 'hotelPerNight' ||
      planField === 'transportBudget'
    ) {
      store.plan[planField] = Math.max(0, Number(target.value) || 0);
    }
    calculateBudget();
    schedulePlanPersist();
    const budgetEl = document.getElementById('plannerBudget');
    if (budgetEl) budgetEl.innerHTML = renderPlannerBudgetSummary();
  }
});

// Delegated select filter changes
document.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;

  const filterKey = target.dataset.filter;
  if (filterKey === 'region') {
    store.ui.filters.region = target.value;
    const box = document.getElementById('destResults');
    if (box) box.innerHTML = renderDestinationResults();
  } else if (filterKey === 'category') {
    store.ui.filters.category = target.value;
    const box = document.getElementById('destResults');
    if (box) box.innerHTML = renderDestinationResults();
  } else if (filterKey === 'sort') {
    store.ui.filters.sort = target.value;
    const box = document.getElementById('destResults');
    if (box) box.innerHTML = renderDestinationResults();
  } else if (filterKey === 'culinary-region') {
    store.ui.culinaryRegion = target.value;
    const box = document.getElementById('culinaryResults');
    if (box) box.innerHTML = renderCulinaryResults();
  } else if (filterKey === 'stays-region') {
    store.ui.staysRegion = target.value;
    const box = document.getElementById('staysResults');
    if (box) box.innerHTML = renderStaysResults();
  }
});

// Delegated form submissions
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.dataset.action === 'hero-search-form') {
    event.preventDefault();
    const input = /** @type {HTMLInputElement|null} */ (
      document.getElementById('heroSearch')
    );
    store.ui.filters.q = input?.value.trim() || '';
    store.ui.filters.region = '';
    store.ui.filters.category = '';
    navigateTo('destinations');
    return;
  }

  if (form.id === 'adminForm') {
    event.preventDefault();
    handleAdminFormSubmit(form, renderApp);
    return;
  }

  if (form.id === 'reportForm') {
    event.preventDefault();
    void handleReportFormSubmit(form, renderApp);
  }
});

// Highlight region marker on map when hovering/focusing a region pill
document.addEventListener(
  'pointerenter',
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pill = target.closest('[data-map-focus]');
    if (pill instanceof HTMLElement && pill.dataset.mapFocus) {
      focusRegionOnMap(pill.dataset.mapFocus);
    }
  },
  true,
);

// Keyboard accessibility: Escape closes modals/menu
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeMobileNav();
  }
});

// Browser hash navigation support
window.addEventListener('hashchange', () => {
  store.ui.view = parseViewFromHash();
  renderApp();
});

// Initial bootstrap
store.ui.view = parseViewFromHash();
renderApp();
initAuthAndSync(renderApp);
