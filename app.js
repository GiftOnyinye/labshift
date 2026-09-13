/* LabShift — bootstrap: tabs, name/role/date save, reset, init calls.
   Loaded last so it can wire up everything else. */
(function () {
  const TEACHER_PASSWORD = 'Beatitude2025+';
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

    /* If the saved role was teacher but the session is not unlocked
       (e.g. the page was refreshed after the tab was closed), reset. */
    if (roleSelect.value === 'teacher' && !isTeacherUnlocked()) {
      roleSelect.value = 'student';
    }

    /* When the user picks "Teacher (demo)", ask for the password. */
    roleSelect.addEventListener('change', function () {
      if (roleSelect.value === 'teacher') {
        const entered = window.prompt('Enter teacher password:');
        if (entered === TEACHER_PASSWORD) {
          setTeacherUnlocked(true);
          const live = document.getElementById('bookingLive');
          if (live) {
            live.textContent = 'Teacher access unlocked for this session.';
            live.className = 'live success';
          }
        } else {
          roleSelect.value = 'student';
          const live = document.getElementById('bookingLive');
          if (live) {
            live.textContent = entered === null
              ? 'Teacher password cancelled.'
              : 'Incorrect password. Stayed as student.';
            live.className = 'live error';
          }
        }
      } else {
        /* Switching back to student clears the unlocked session. */
        setTeacherUnlocked(false);
      }
    });

    saveBtn.addEventListener('click', function () {
      /* If the role select still says "teacher" but we are not unlocked,
         force back to student before saving. */
      if (roleSelect.value === 'teacher' && !isTeacherUnlocked()) {
        roleSelect.value = 'student';
      }

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

  /* Session-scoped teacher unlock. Uses sessionStorage so it survives
     a page refresh but is cleared when the tab is closed. */
  function isTeacherUnlocked() {
    try {
      return sessionStorage.getItem('labshift_teacher_unlocked') === 'yes';
    } catch (e) {
      return false;
    }
  }

  function setTeacherUnlocked(on) {
    try {
      if (on) {
        sessionStorage.setItem('labshift_teacher_unlocked', 'yes');
      } else {
        sessionStorage.removeItem('labshift_teacher_unlocked');
      }
    } catch (e) { /* ignore */ }
  }

  function initReset() {
    const btn = document.getElementById('resetDemoBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const ok = window.confirm(
        'Clear ALL local LabShift data in this browser?\n\n' +
        'This removes your saved name/role, STEM Club logs, and the last quiz score.\n' +
        'Bookings stored in the shared database are NOT affected.\n' +
        'It cannot be undone.'
      );
      if (!ok) return;

      Storage.del('labshift_name');
      Storage.del('labshift_role');
      Storage.del('labshift_schedule_date');
      Storage.del('labshift_logs_v2');
      Storage.del('labshift_last_quiz_score');

      try { sessionStorage.removeItem('labshift_teacher_unlocked'); } catch (e) {}

      window.location.reload();
    });
  }

  function initStorageWarning() {
    if (!Storage.available()) {
      const live = document.getElementById('bookingLive');
      if (live) {
        live.textContent = 'Warning: this browser is blocking local storage. Your name and logs will not persist.';
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
