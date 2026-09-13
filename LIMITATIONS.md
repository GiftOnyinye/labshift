# Limitations

LabShift is a working prototype, not a finished product. This file lists
the honest limits so nobody mistakes it for something it is not.

## Security

- **The teacher password is visible in the public source code.** Anyone who
  opens `app.js` on GitHub can read it. It stops casual students, not
  determined ones.
- **The Supabase key is visible in the browser.** This is expected — it is a
  publishable key designed to be public. But it means anyone with the URL
  and key can read or write bookings directly, bypassing the app.
- **No real authentication.** There are no per-user accounts. The teacher
  unlock is session-scoped and stored in the browser, not the server.
- **No server-side permission checks.** The database policies currently
  allow anyone to read, insert, or delete bookings.

## Data

- **Bookings are shared via Supabase.** They need internet to load or save.
- **STEM Club logs are local only.** They do not sync between devices.
- **Quiz scores are local only.**
- **Clearing browser data** removes local items (name, logs, score) but
  does not remove bookings from Supabase.

## Features

- **No timezone handling.** Times are strings like `"9:00"` — they mean
  whatever the user thinks they mean.
- **No conflict prevention at the UI level.** Two students tapping the same
  slot at the same second will race; the second gets a 409 from the
  database and a "someone just booked that" message.
- **No per-student history.** A student cannot see how many hours they
  have used this term.
- **No station health tracking.** A broken machine cannot be hidden from
  the grid.

## Testing

- Not yet tested on older Android browsers.
- Corrupted-storage, keyboard-only, and text-zoom tests are listed in
  `TESTING.md` but not yet run.
- No automated tests. All testing is manual.

## Intended use

Fine for a classroom demo or a small trial with a trusted group. Not yet
ready for wider deployment without the production architecture described
below.

## Production architecture (what would change)

A real school-wide version would need:

1. **A local network server or hosted backend** with a shared database.
2. **Authenticated accounts** — real teacher logins, not a shared password.
3. **Server-side permission checks** — the role claim must come from the
   server, not the client.
4. **Tightened database policies** — only authenticated users can insert;
   only teachers can delete any booking.
5. **Conflict prevention** — either optimistic locking or a "first write
   wins" rule enforced by the database.

The current offline-first client is designed so these can be added without
rewriting the UI.
