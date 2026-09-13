/* LabShift — Supabase client and data layer.
   Replaces localStorage with a shared database for bookings.
   Quiz and STEM log remain local (they do not need to be shared). */

const SUPABASE_URL = 'https://kjglmjumfzxydgkasalf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FAoQhXUg6uZYsm9-RbJYvw_wLbfKUgF';

/* Minimal fetch wrapper — no SDK, no build step. */
const Supa = (function () {
  function headers() {
    return {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    };
  }

  async function listBookings(date) {
    try {
      const url = SUPABASE_URL +
        '/rest/v1/bookings?schedule_date=eq.' + encodeURIComponent(date) +
        '&select=station,time_slot,name,role,created_at';
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) {
        console.warn('Supa.listBookings failed', res.status);
        return { ok: false, rows: [], status: res.status };
      }
      const rows = await res.json();
      return { ok: true, rows: rows };
    } catch (e) {
      console.warn('Supa.listBookings error', e);
      return { ok: false, rows: [], offline: true };
    }
  }

  async function insertBooking(booking) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/bookings', {
        method: 'POST',
        headers: Object.assign({}, headers(), { 'Prefer': 'return=minimal' }),
        body: JSON.stringify(booking)
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      console.warn('Supa.insertBooking error', e);
      return { ok: false, offline: true };
    }
  }

  async function deleteBooking(station, timeSlot, date) {
    try {
      const url = SUPABASE_URL + '/rest/v1/bookings' +
        '?station=eq.' + station +
        '&time_slot=eq.' + encodeURIComponent(timeSlot) +
        '&schedule_date=eq.' + encodeURIComponent(date);
      const res = await fetch(url, {
        method: 'DELETE',
        headers: headers()
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      console.warn('Supa.deleteBooking error', e);
      return { ok: false, offline: true };
    }
  }

  return {
    listBookings: listBookings,
    insertBooking: insertBooking,
    deleteBooking: deleteBooking
  };
})();

/* Expose to other scripts. */
window.Supa = Supa;
