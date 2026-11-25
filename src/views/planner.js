import {renderEmptyState, t} from '../components/ui.js';
import {calculateBudget, getDestinationById, store} from '../state/store.js';
import {escapeHTML, money, todayISO} from '../utils/format.js';

export function renderPlannerBudgetSummary() {
  const b = calculateBudget();
  return `
    <div class="budget-grid">
      <div class="budget-tile">
        <span>${escapeHTML(t('destinationCost'))}</span>
        <b>${escapeHTML(money(b.dest))}</b>
      </div>
      <div class="budget-tile">
        <span>${escapeHTML(t('foodCost'))}</span>
        <b>${escapeHTML(money(b.food))}</b>
      </div>
      <div class="budget-tile">
        <span>${escapeHTML(t('hotelCost'))}</span>
        <b>${escapeHTML(money(b.stay))}</b>
      </div>
      <div class="budget-tile">
        <span>${escapeHTML(t('transportCost'))}</span>
        <b>${escapeHTML(money(b.transport))}</b>
      </div>
    </div>
    <div class="total-box">
      <span>${escapeHTML(t('estimatedTotal'))}</span>
      <strong>${escapeHTML(money(b.total))}</strong>
    </div>
  `;
}

export function renderPlannerDayOptions() {
  const days = Math.min(5, Math.max(1, Number(store.plan.jumlahHari) || 1));
  return Array.from(
    {length: days},
    (_, idx) => `<option value="${idx + 1}">${escapeHTML(t('day'))} ${idx + 1}</option>`,
  ).join('');
}

export function renderPlannerView() {
  const p = store.plan;
  const activities = p.daftarAktivitas
    .map((act, index) => ({
      ...act,
      index,
      dest: getDestinationById(act.itemId),
    }))
    .filter((item) => Boolean(item.dest))
    .sort((a, b) => a.day - b.day || a.index - b.index);

  const isSignedIn = store.auth.status === 'authenticated';

  return `
    <section class="page-head">
      <span class="kicker">${escapeHTML(t('navPlanner'))} · 1–5</span>
      <h1>${escapeHTML(t('plannerTitle'))}</h1>
      <p>${escapeHTML(t('plannerDesc'))}</p>
      <p class="small-muted" style="margin-top:8px">
        ${escapeHTML(isSignedIn ? t('userStatusCloud') : t('userStatusLocal'))}
        ${
          !isSignedIn
            ? ` <button type="button" class="text-link" data-view="login">${escapeHTML(
                t('goToLogin'),
              )}</button>`
            : ''
        }
      </p>
    </section>

    <div class="planner-layout">
      <section class="panel">
        <h3>${escapeHTML(t('tripReady'))}</h3>
        <div class="form-grid">
          <div class="field full">
            <label for="planName">${escapeHTML(t('tripName'))}</label>
            <input
              id="planName"
              type="text"
              data-plan-live="namaPerjalanan"
              value="${escapeHTML(p.namaPerjalanan)}"
            />
          </div>

          <div class="field">
            <label for="planDate">${escapeHTML(t('startDate'))}</label>
            <input
              id="planDate"
              type="date"
              data-plan-live="tanggalMulai"
              value="${escapeHTML(p.tanggalMulai || todayISO())}"
            />
          </div>

          <div class="field">
            <label for="planDays">${escapeHTML(t('days'))}</label>
            <select id="planDays" data-plan-live="jumlahHari">
              ${[1, 2, 3, 4, 5]
                .map(
                  (n) =>
                    `<option value="${n}" ${
                      Number(p.jumlahHari) === n ? 'selected' : ''
                    }>${n}</option>`,
                )
                .join('')}
            </select>
          </div>

          <div class="field">
            <label for="planTravellers">${escapeHTML(t('travellers'))}</label>
            <input
              id="planTravellers"
              type="number"
              min="1"
              max="30"
              data-plan-live="jumlahWisatawan"
              value="${Number(p.jumlahWisatawan) || 1}"
            />
          </div>

          <div class="field">
            <label for="planRooms">${escapeHTML(t('rooms'))}</label>
            <input
              id="planRooms"
              type="number"
              min="0"
              max="20"
              data-plan-live="rooms"
              value="${Number(p.rooms) || 0}"
            />
          </div>

          <div class="field full">
            <label for="planDest">${escapeHTML(t('selectDest'))}</label>
            <select id="planDest">
              <option value="">— ${escapeHTML(t('selectDest'))} —</option>
              ${store.db.destinations
                .map(
                  (d) =>
                    `<option value="${escapeHTML(d.id)}">${escapeHTML(
                      d.nama,
                    )} · ${escapeHTML(d.wilayah)}</option>`,
                )
                .join('')}
            </select>
          </div>

          <div class="field">
            <label for="planDay">${escapeHTML(t('day'))}</label>
            <select id="planDay">${renderPlannerDayOptions()}</select>
          </div>

          <div class="field" style="justify-content:flex-end">
            <button type="button" class="btn" data-action="add-activity">
              + ${escapeHTML(t('addActivity'))}
            </button>
          </div>
        </div>

        <div class="panel-subhead">
          <h3>${escapeHTML(t('activities'))}</h3>
          ${
            activities.length
              ? `<button type="button" class="btn small ghost" data-action="clear-activities">${escapeHTML(
                  t('clearActivities'),
                )}</button>`
              : ''
          }
        </div>

        <div class="activity-list">
          ${
            activities.length
              ? activities
                  .map(
                    (a) => `<div class="activity">
                      <span class="day-badge">D${a.day}</span>
                      <div class="activity-info">
                        <b>${escapeHTML(a.dest?.nama)}</b>
                        <span class="tabular">${escapeHTML(
                          a.dest?.wilayah,
                        )} · ${escapeHTML(money(a.dest?.estimasiBiaya || 0))} ${escapeHTML(
                      t('perPerson'),
                    )}</span>
                      </div>
                      <button
                        type="button"
                        class="icon-btn"
                        data-action="remove-activity"
                        data-index="${a.index}"
                        aria-label="${escapeHTML(t('remove'))} ${escapeHTML(
                      a.dest?.nama,
                    )}"
                      >×</button>
                    </div>`,
                  )
                  .join('')
              : renderEmptyState(t('activities'), t('noActivities'))
          }
        </div>
      </section>

      <section class="panel">
        <h3>${escapeHTML(t('costInputs'))}</h3>
        <div class="form-grid">
          <div class="field">
            <label for="planFood">${escapeHTML(t('food'))}</label>
            <input
              id="planFood"
              type="number"
              min="0"
              step="10000"
              data-plan-live="foodPerPersonPerDay"
              value="${Number(p.foodPerPersonPerDay) || 0}"
            />
          </div>

          <div class="field">
            <label for="planHotel">${escapeHTML(t('hotel'))}</label>
            <input
              id="planHotel"
              type="number"
              min="0"
              step="25000"
              data-plan-live="hotelPerNight"
              value="${Number(p.hotelPerNight) || 0}"
            />
          </div>

          <div class="field full">
            <label for="planTransport">${escapeHTML(t('transport'))}</label>
            <input
              id="planTransport"
              type="number"
              min="0"
              step="25000"
              data-plan-live="transportBudget"
              value="${Number(p.transportBudget) || 0}"
            />
          </div>
        </div>

        <div id="plannerBudget">${renderPlannerBudgetSummary()}</div>

        <div class="planner-actions">
          <button type="button" class="btn" style="flex:1" data-action="save-plan">
            ${escapeHTML(t('savePlan'))}
          </button>
          <button type="button" class="btn secondary" data-action="export-plan">
            ${escapeHTML(t('exportPlan'))}
          </button>
        </div>

        <p class="small-muted" style="margin:14px 0 0">${escapeHTML(
          t('budgetNote'),
        )}</p>
      </section>
    </div>
  `;
}
