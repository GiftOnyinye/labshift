# Manual test checklist

Run on the live site: https://giftonyinye.github.io/labshift/

Statuses: ✅ passed | ❌ failed | ⏳ not yet tested

## Booking

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Set name and role | "Signed in as..." appears with badge | ✅ |
| 2 | Book an available slot | Cell turns amber, appears in My bookings | ✅ |
| 3 | Booking limit | Third booking attempt shows red error | ✅ |
| 4 | Release own booking | Confirm dialog, cell clears | ✅ |
| 5 | Persistence across refresh | Booking still there after refresh | ✅ |
| 6 | Cross-device sync | Booking on phone appears on laptop | ✅ |
| 7 | Release syncs | Released booking disappears on other device | ✅ |

## Teacher access

| # | Test | Expected | Status |
|---|------|----------|--------|
| 8 | Wrong password rejected | Dropdown snaps back to Student | ✅ |
| 9 | Correct password unlocks | Overview tab appears | ✅ |
| 10 | Refresh keeps unlock | Role stays Teacher after refresh | ✅ |
| 11 | New tab requires password | Role resets to Student | ✅ |
| 12 | Teacher cancels any booking | Cancel button works in Overview | ✅ |

## STEM Club log

| # | Test | Expected | Status |
|---|------|----------|--------|
| 13 | Add entry | Appears in Club history | ✅ |
| 14 | Edit entry | Changes save | ✅ |
| 15 | Delete entry with confirm | Entry disappears | ✅ |
| 16 | Category filter | Only matching entries shown | ✅ |
| 17 | JSON export | File downloads with entries | ✅ |
| 18 | HTML escaping | `<b>x</b>` renders as text, not bold | ✅ |

## Quiz

| # | Test | Expected | Status |
|---|------|----------|--------|
| 19 | Explanations appear | Shown per question after check | ✅ |
| 20 | Unanswered detected | Marked separately | ✅ |
| 21 | Try again | Resets answers | ✅ |
| 22 | Last score saved | Shown on next visit | ✅ |

## Robustness

| # | Test | Expected | Status |
|---|------|----------|--------|
| 23 | Corrupted localStorage | App still loads with defaults | ⏳ |
| 24 | Offline (booking) | Clear "Offline" error shown | ✅ |
| 25 | Keyboard navigation | Grid cells reachable via Tab | ⏳ |
| 26 | Small screen (phone) | Grid scrolls, layout intact | ✅ |
| 27 | Text enlarged 200% | Layout still usable | ⏳ |

Items marked ⏳ have not yet been run. They are worth doing before any
serious use.
