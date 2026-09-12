/* LabShift — bootstrap: tabs, name/role/date save, reset, init calls.
   Loaded last so it can wire up everything else. */
(function () {
  const KEY_NAME = 'labshift_name';
  const KEY_ROLE = 'labshift_role';
  const KEY_DATE = 'labshift_schedule_date';

  function initTabs() {
    const tabs = document.querySelectorAll('nav.tabs button');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('section.panel').forEach(function (p) {
          p.classList.remove('active');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('panel-' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  function initNameBar() {
    const nameInput = document.getElementById('studentName');
    const roleSelect = document.getElementById('roleSelect');
    const dateInput = document.getElementById('scheduleDate');
    const saveBtn = document.getElementById('saveName');

    if (!nameInput || !roleSelect || !dateInput || !saveBtn) return;

    nameInput.value = window.LabShiftBooking.currentName() || '';
    roleSelect.value = window.LabShiftBooking.currentRole() || 'student';
    dateInput.value = window.LabShiftBooking.currentDate();

    saveBtn.addEventListener('click', function () {
      const result = window.LabShiftBooking.saveIdentity({
        name: nameInput.value,
        role: roleSelect.value,
        date: dateInput.value
      });

      const live = document.getElementById('bookingLive');
      if (live) {
        live.textContent = result.message;
        live.className = 'live ' + (result.ok ? 'success' : 'error');
      }
    });
  }

  function initReset() {
    const btn = document.getElementById('resetDemoBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const ok = window.confirm(
        'Clear ALL local LabShift data in this browser?\n\n' +
        'This removes bookings, STEM Club logs, your saved name/role, and the last quiz score.\n' +
        'It cannot be undone.'
      );
      if (!ok) return;

      Storage.del('labshift_name');
      Storage.del('labshift_role');
      Storage.del('labshift_schedule_date');
      Storage.del('labshift_bookings_v2');
      Storage.del('labshift_logs_v2');
      Storage.del('labshift_last_quiz_score');

      window.location.reload();
    });
  }

  function initStorageWarning() {
    if (!Storage.available()) {
      const live = document.getElementById('bookingLive');
      if (live) {
        live.textContent = 'Warning: this browser is blocking local storage. Bookings and logs will not persist.';
        live.className = 'live error';
      }
    }
  }

  function boot() {
    initTabs();
    initNameBar();
    initReset();
    initStorageWarning();

    window.LabShiftBooking.init();
    window.LabShiftQuiz.init();
    window.LabShiftLogs.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();