/* LabShift — safe localStorage wrapper. No passwords, no tokens. */
const Storage = (function () {
  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('LabShift: read failed for', key, e);
      return fallback;
    }
  }
  function set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('LabShift: write failed for', key, e); return false; }
  }
  function del(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }
  function available() {
    try {
      const k = '__labshift_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }
  return { get, set, del, available };
})();

/* Escaping helpers — used for every user-entered string rendered to the DOM. */
function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}
function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, '&quot;');
}
function formatDateTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch (e) { return String(iso); }
}