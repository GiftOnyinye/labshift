/* LabShift — booking grid, roles, permissions, teacher overview.
   Now reads/writes bookings via Supabase instead of localStorage. */

const STATIONS = 8;
const TIMES = ["8:00","8:30","9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","1:00","1:30"];
const BOOKING_LIMIT = 2;
const KEY_NAME = 'labshift_name';
const KEY_ROLE = 'labshift_role';
const KEY_DATE = 'labshift_schedule_date';

let bookings = {};          // keyed by "station-time"
let myName = Storage.get(KEY_NAME, '');
let myRole = Storage.get(KEY_ROLE, 'student');
let scheduleDate = Storage.get(KEY_DATE, new Date().toISOString().slice(0,10));

/* ---- Permission helpers ---- */
function isTeacher() { return myRole === 'teacher'; }
function getMyBookings() {
  return Object.entries(bookings)
    .filter(([, v]) => v && v.name === myName)
    .map(([key, v]) => Object.assign({ key: key }, v));
}
function hasBookingLimit() {
  if (isTeacher()) return false;
  return getMyBookings().length >= BOOKING_LIMIT;
}
function canBook() {
  if (!myName) return { ok: false, reason: 'Set your name first.' };
  if (hasBookingLimit())
    return { ok: false, reason: 'Booking limit reached (' + BOOKING_LIMIT + ' active bookings). Release one to book another.' };
  return { ok: true };
}
function canCancelBooking(entry) {
  if (!entry) return false;
  if (isTeacher()) return true;
  return entry.name === myName;
}

/* ---- Rendering ---- */
function slotLabel(station, time, state, name) {
  const base = 'Station ' + station + ', ' + time;
  if (state === 'available') return base + ', available';
  if (state === 'mine') return base + ', booked by me';
  return base + ', booked by ' + name;
}

function renderGrid() {
  const table = document.getElementById('bookingGrid');
  if (!table) return;
  let html = '<thead><tr><th scope="col" class="stationlabel">Station</th>';
  TIMES.forEach(function (t) { html += '<th scope="col">' + t + '</th>'; });
  html += '</tr></thead><tbody>';

  for (let s = 1; s <= STATIONS; s++) {
    html += '<tr><th scope="row" class="stationlabel">Station ' + s + '</th>';
    TIMES.forEach(function (t) {
      const key = s + '-' + t;
      const entry = bookings[key];
      const mine = entry && entry.name === myName;
      let cls = 'slot';
      let state = 'available';
      let statusText = 'Available';
      let displayName = '·';
      if (entry) {
        state = mine ? 'mine' : 'booked';
        cls += mine ? ' mine' : ' booked';
        statusText = mine ? 'Booked by me' : ('Booked by ' + entry.name);
        displayName = entry.name;
      }
      const label = slotLabel(s, t, state, entry ? entry.name : '');
      html += '<td><button type="button" class="' + cls + '" data-key="' + key +
        '" aria-label="' + escapeAttr(label) + '">' +
        '<span aria-hidden="true">' + escapeHTML(displayName) + '</span>' +
        '<span class="slot-status" aria-hidden="true">' + escapeHTML(statusText) + '</span>' +
        '</button></td>';
    });
    html += '</tr>';
  }
  html += '</tbody>';
  table.innerHTML = html;

  table.querySelectorAll('.slot').forEach(function (btn) {
    btn.addEventListener('click', function () { handleSlotClick(btn.dataset.key); });
  });
}

function announceBooking(msg, kind) {
  const el = document.getElementById('bookingLive');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'live' + (kind ? ' ' + kind : '');
}

async function refreshFromServer() {
  announceBooking('Loading bookings…');
  const res = await Supa.listBookings(scheduleDate);
  if (!res.ok) {
    if (res.offline) {
      announceBooking('Offline — could not reach the booking server.', 'error');
    } else {
      announceBooking('Could not load bookings (status ' + res.status + ').', 'error');
    }
    return;
  }
  bookings = {};
  res.rows.forEach(function (row) {
    const key = row.station + '-' + row.time_slot;
    bookings[key] = {
      name: row.name,
      role: row.role,
      createdAt: row.created_at
    };
  });
  renderGrid();
  renderMyBookings();
  renderOverview();
  announceBooking('');
}

async function handleSlotClick(key) {
  if (!myName) { announceBooking('Set your name first, then try again.', 'error'); return; }
  const entry = bookings[key];
  const parts = key.split('-');
  const station = parts[0], time = parts[1];

  if (entry) {
    if (!canCancelBooking(entry)) {
      announceBooking('Station ' + station + ', ' + time + ' is booked by ' + entry.name +
        '. You can only release your own bookings.', 'error');
      return;
    }
    const prompt = entry.name === myName
      ? 'Release Station ' + station + ' at ' + time + '?'
      : 'Cancel ' + entry.name + '\'s booking at Station ' + station + ', ' + time + '?';
    if (!window.confirm(prompt)) { announceBooking('Cancelled — nothing changed.'); return; }

    const res = await Supa.deleteBooking(parseInt(station, 10), time, scheduleDate);
    if (!res.ok) {
      announceBooking(res.offline ? 'Offline — could not release.' : 'Release failed (status ' + res.status + ').', 'error');
      return;
    }
    await refreshFromServer();
    announceBooking(entry.name === myName
      ? 'Released Station ' + station + ' at ' + time + '.'
      : 'Cancelled ' + entry.name + '\'s booking at Station ' + station + ', ' + time + '.',
      'success');
    return;
  }

  const perm = canBook();
  if (!perm.ok) { announceBooking(perm.reason, 'error'); return; }

  const res = await Supa.insertBooking({
    station: parseInt(station, 10),
    time_slot: time,
    schedule_date: scheduleDate,
    name: myName,
    role: myRole
  });

  if (!res.ok) {
    if (res.status === 409) {
      announceBooking('Someone else just booked that slot. Refreshing…', 'error');
      await refreshFromServer();
      return;
    }
    announceBooking(res.offline ? 'Offline — could not book.' : 'Booking failed (status ' + res.status + ').', 'error');
    return;
  }

  await refreshFromServer();
  announceBooking('Booked Station ' + station + ' at ' + time + ' for ' + myName + '.', 'success');
}

function renderMyBookings() {
  const box = document.getElementById('myBookingsList');
  if (!box) return;
  if (!myName) {
    box.innerHTML = '<p class="muted" style="margin:0;">Set your name to see your bookings.</p>';
    return;
  }
  const mine = getMyBookings().sort(function (a, b) { return a.key.localeCompare(b.key); });
  if (mine.length === 0) {
    box.innerHTML = '<p class="muted" style="margin:0;">No active bookings yet.</p>';
    return;
  }
  box.innerHTML = '<ul>' + mine.map(function (b) {
    const parts = b.key.split('-');
    return '<li><strong>Station ' + escapeHTML(parts[0]) + '</strong> at ' + escapeHTML(parts[1]) +
      ' <span class="muted">(booked ' + escapeHTML(formatDateTime(b.createdAt)) + ')</span></li>';
  }).join('') + '</ul>';
}

function renderOverview() {
  const listEl = document.getElementById('overviewList');
  const statsEl = document.getElementById('overviewStats');
  if (!listEl || !statsEl) return;

  const entries = Object.entries(bookings).sort(function (a, b) { return a[0].localeCompare(b[0]); });

  if (entries.length === 0) {
    listEl.innerHTML = '<p class="muted">No active bookings right now.</p>';
  } else {
    listEl.innerHTML = entries.map(function (pair) {
      const key = pair[0], v = pair[1];
      const parts = key.split('-');
      return '<div class="log-entry">' +
        '<strong>' + escapeHTML(v.name) + '</strong>' +
        '<span class="role-badge">' + escapeHTML(v.role) + '</span>' +
        ' — Station ' + escapeHTML(parts[0]) + ', ' + escapeHTML(parts[1]) +
        '<div class="meta">Booked ' + escapeHTML(formatDateTime(v.createdAt)) + '</div>' +
        '<button class="ghost danger" type="button" data-cancelkey="' + escapeAttr(key) + '">Cancel booking</button>' +
        '</div>';
    }).join('');

    listEl.querySelectorAll('[data-cancelkey]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const key = btn.dataset.cancelkey;
        const entry = bookings[key];
        if (!entry) return;
        if (!isTeacher()) { alert('Only teachers can cancel other users\' bookings in this demo.'); return; }
        const parts = key.split('-');
        if (!window.confirm('Cancel ' + entry.name + '\'s booking at Station ' + parts[0] + ', ' + parts[1] + '?')) return;

        const res = await Supa.deleteBooking(parseInt(parts[0], 10), parts[1], scheduleDate);
        if (!res.ok) {
          announceBooking('Cancel failed.', 'error');
          return;
        }
        await refreshFromServer();
      });
    });
  }

  const totalSlots = STATIONS * TIMES.length;
  const bookedCount = entries.length;
  const uniqueNames = new Set(entries.map(function (p) { return p[1].name; })).size;
  statsEl.innerHTML =
    '<p>Slots booked: <strong>' + bookedCount + ' / ' + totalSlots + '</strong></p>' +
    '<p>Unique students with bookings: <strong>' + uniqueNames + '</strong></p>' +
    '<p>STEM club entries logged: <strong>' + (window.LabShiftLogs ? window.LabShiftLogs.count() : 0) + '</strong></p>' +
    '<p class="muted">Schedule date (demo): ' + escapeHTML(scheduleDate) + '</p>';
}

function updateNameLabel() {
  const el = document.getElementById('currentNameLabel');
  if (!el) return;
  if (!myName) { el.textContent = ''; return; }
  el.innerHTML = 'Signed in as: ' + escapeHTML(myName) +
    '<span class="role-badge">' + escapeHTML(myRole) + '</span>';
}

function applyRoleVisibility() {
  const btn = document.getElementById('overviewTabBtn');
  if (!btn) return;
  btn.style.display = isTeacher() ? 'inline-block' : 'none';
  if (!isTeacher() && btn.classList.contains('active')) {
    const book = document.querySelector('nav.tabs button[data-tab="book"]');
    if (book) book.click();
  }
}

/* ---- Public API for app.js ---- */
function currentName() { return myName; }
function currentRole() { return myRole; }
function currentDate() { return scheduleDate; }

function saveIdentity(input) {
  const newName = (input.name || '').trim();
  if (!newName) return { ok: false, message: 'Please enter your name.' };

  myName = newName;
  myRole = input.role === 'teacher' ? 'teacher' : 'student';
  if (input.date) scheduleDate = input.date;

  Storage.set(KEY_NAME, myName);
  Storage.set(KEY_ROLE, myRole);
  Storage.set(KEY_DATE, scheduleDate);

  updateNameLabel();
  applyRoleVisibility();
  refreshFromServer();

  return { ok: true, message: 'Saved. Signed in as ' + myName + ' (' + myRole + ').' };
}

function init() {
  updateNameLabel();
  applyRoleVisibility();
  refreshFromServer();
}

window.LabShiftBooking = {
  init: init,
  renderOverview: renderOverview,
  currentName: currentName,
  currentRole: currentRole,
  currentDate: currentDate,
  saveIdentity: saveIdentity
};
