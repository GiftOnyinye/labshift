/* LabShift — STEM Club demonstration log.
   Add, edit, delete (with confirm), category filter, JSON export.
   All rendering escapes user input. */
(function () {
  const KEY_LOGS = 'labshift_logs_v2';

  let logs = loadLogs();
  let editingId = null;

  function loadLogs() {
    const raw = Storage.get(KEY_LOGS, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (e) {
      return e && typeof e === 'object' && typeof e.title === 'string';
    }).map(function (e) {
      return {
        id: typeof e.id === 'string' ? e.id : makeId(),
        title: e.title,
        materials: typeof e.materials === 'string' ? e.materials : '',
        category: typeof e.category === 'string' ? e.category : 'Other',
        notes: typeof e.notes === 'string' ? e.notes : '',
        date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
        updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : (e.date || new Date().toISOString())
      };
    });
  }

  function makeId() {
    return 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function persist() {
    if (!Storage.set(KEY_LOGS, logs)) {
      announce('Could not save to browser storage (unavailable or full).', 'error');
    }
  }

  function announce(msg, kind) {
    const el = document.getElementById('logLive');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'live' + (kind ? ' ' + kind : '');
  }

  function currentFilter() {
    const sel = document.getElementById('filterCategory');
    return sel ? sel.value : '';
  }

  function sortedFiltered() {
    const filter = currentFilter();
    return logs
      .filter(function (e) { return !filter || e.category === filter; })
      .sort(function (a, b) {
        return (b.updatedAt || b.date || '').localeCompare(a.updatedAt || a.date || '');
      });
  }

  function renderList() {
    const list = document.getElementById('logList');
    if (!list) return;

    const items = sortedFiltered();
    if (items.length === 0) {
      list.innerHTML = '<p class="muted">No entries' +
        (currentFilter() ? ' in this category.' : ' yet — add the first demonstration above.') + '</p>';
      return;
    }

    list.innerHTML = items.map(function (e) {
      return '<div class="log-entry">' +
        '<h3>' + escapeHTML(e.title) +
          '<span class="category-tag">' + escapeHTML(e.category) + '</span>' +
        '</h3>' +
        '<div class="meta">' +
          escapeHTML(formatDateTime(e.date)) +
          (e.materials ? ' · Materials: ' + escapeHTML(e.materials) : '') +
        '</div>' +
        (e.notes ? '<p>' + escapeHTML(e.notes) + '</p>' : '') +
        '<div class="log-actions">' +
          '<button class="ghost" type="button" data-edit="' + escapeAttr(e.id) + '">Edit</button>' +
          '<button class="ghost danger" type="button" data-delete="' + escapeAttr(e.id) + '">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { startEdit(btn.dataset.edit); });
    });
    list.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { confirmDelete(btn.dataset.delete); });
    });
  }

  function readForm() {
    return {
      title: (document.getElementById('logTitle').value || '').trim(),
      materials: (document.getElementById('logMaterials').value || '').trim(),
      category: document.getElementById('logCategory').value || 'Other',
      notes: (document.getElementById('logNotes').value || '').trim()
    };
  }

  function clearForm() {
    document.getElementById('logTitle').value = '';
    document.getElementById('logMaterials').value = '';
    document.getElementById('logCategory').value = 'Programming';
    document.getElementById('logNotes').value = '';
  }

  function setFormMode(mode) {
    const heading = document.getElementById('logFormHeading');
    const addBtn = document.getElementById('addLog');
    const cancelBtn = document.getElementById('cancelEdit');
    if (mode === 'edit') {
      if (heading) heading.textContent = 'Edit demonstration';
      if (addBtn) addBtn.textContent = 'Save changes';
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
    } else {
      if (heading) heading.textContent = 'Add a demonstration';
      if (addBtn) addBtn.textContent = 'Add to log';
      if (cancelBtn) cancelBtn.style.display = 'none';
      editingId = null;
    }
  }

  function startEdit(id) {
    const entry = logs.find(function (e) { return e.id === id; });
    if (!entry) return;
    editingId = id;
    document.getElementById('logTitle').value = entry.title;
    document.getElementById('logMaterials').value = entry.materials;
    document.getElementById('logCategory').value = entry.category;
    document.getElementById('logNotes').value = entry.notes;
    setFormMode('edit');
    document.getElementById('logTitle').focus();
    announce('Editing "' + entry.title + '". Change the fields and click Save changes.', '');
  }

  function confirmDelete(id) {
    const entry = logs.find(function (e) { return e.id === id; });
    if (!entry) return;
    if (!window.confirm('Delete "' + entry.title + '"? This cannot be undone.')) return;
    logs = logs.filter(function (e) { return e.id !== id; });
    persist();
    renderList();
    if (window.LabShiftBooking && typeof window.LabShiftBooking.renderOverview === 'function') {
      window.LabShiftBooking.renderOverview();
    }
    announce('Deleted "' + entry.title + '".', 'success');
  }

  function submit() {
    const data = readForm();
    if (!data.title) {
      announce('Please give the demonstration a title.', 'error');
      document.getElementById('logTitle').focus();
      return;
    }

    if (editingId) {
      const idx = logs.findIndex(function (e) { return e.id === editingId; });
      if (idx === -1) { editingId = null; setFormMode('add'); return; }
      logs[idx] = Object.assign({}, logs[idx], data, { updatedAt: new Date().toISOString() });
      persist();
      clearForm();
      setFormMode('add');
      renderList();
      announce('Saved changes to "' + data.title + '".', 'success');
    } else {
      const entry = {
        id: makeId(),
        title: data.title,
        materials: data.materials,
        category: data.category,
        notes: data.notes,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      logs.push(entry);
      persist();
      clearForm();
      renderList();
      announce('Added "' + entry.title + '" to the log.', 'success');
    }

    if (window.LabShiftBooking && typeof window.LabShiftBooking.renderOverview === 'function') {
      window.LabShiftBooking.renderOverview();
    }
  }

  function cancelEdit() {
    editingId = null;
    clearForm();
    setFormMode('add');
    announce('Edit cancelled.', '');
  }

  function exportJSON() {
    if (logs.length === 0) {
      announce('Nothing to export yet.', 'error');
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'labshift-club-logs-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      announce('Exported ' + logs.length + ' entries as JSON.', 'success');
    } catch (err) {
      console.warn('Export failed', err);
      announce('Export failed in this browser.', 'error');
    }
  }

  function count() { return logs.length; }

  function init() {
    renderList();
    const addBtn = document.getElementById('addLog');
    const cancelBtn = document.getElementById('cancelEdit');
    const exportBtn = document.getElementById('exportLogs');
    const filterSel = document.getElementById('filterCategory');
    if (addBtn) addBtn.addEventListener('click', submit);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);
    if (filterSel) filterSel.addEventListener('change', renderList);
  }

  window.LabShiftLogs = { init: init, count: count };
})();