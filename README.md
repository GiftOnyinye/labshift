# LabShift

An offline-friendly computer-lab booking and STEM Club log tool built for
a Nigerian secondary school with limited computer-lab time.

**Live:** https://giftonyinye.github.io/labshift/

## The problem this solves

My school has 8 working computer stations and roughly 40 students who need
them each day. Sessions were being managed from memory:

- Students lost time walking between machines looking for a free one.
- Teachers had no overview of who was booked where.
- STEM Club demonstrations were never recorded.

LabShift addresses all three.

## What it does

- **Booking grid**: 8 stations × 12 time slots per day (96 slots).
- **Students** type their name and book a slot. Booking limit: 2 per student.
- **Teachers** unlock an overview with a password and can cancel any booking.
- **Shared database**: bookings sync between devices over the internet.
- **STEM Club log**: add, edit, delete, filter, and export demonstrations.
- **Python quiz**: short practice for students waiting for a station.

## How it works

- Frontend: plain HTML, CSS, and JavaScript. No framework, no build step.
- Backend: Supabase (hosted Postgres) for the shared bookings table.
- The booking grid reads and writes to a Supabase table called `bookings`
  via its REST API.
- Quiz scores and STEM Club log entries are stored in the browser's
  `localStorage` and are **not** shared between devices.

##

## Roles 

The teacher role is **password-gated**, but the password is visible in the
public source code (`app.js`). This stops a casual student from tapping
"Teacher (demo)" and poking around. It does **not** stop anyone who reads
the source code, and it does **not** protect the database.

A production version would use real per-teacher accounts (Supabase Auth)
with server-side permission checks. See `LIMITATIONS.md`.

## Data storage — the honest version

| What | Where | Shared? |
|---|---|---|
| Bookings | Supabase (internet) | Yes |
| STEM Club log | This browser's localStorage | No |
| Quiz last score | This browser's localStorage | No |
| Your name & role | This browser's localStorage | No |
| Teacher unlock | This browser tab's sessionStorage | No |

Clearing browser data removes the local items. It does **not** remove
bookings from Supabase.

## Running it locally

No build step. Any static file server works, or open `index.html` directly
in a browser. The booking grid needs internet to reach Supabase.

## Technologies

- HTML, CSS, vanilla JavaScript
- Supabase (Postgres + REST API)
- GitHub Pages for hosting

## Why it exists

Built as a school project while I was learning web development. The
constraints were real: no server, no budget, unreliable internet in the lab,
and phones as the primary student device. LabShift is what those constraints
produced.
