# Local seed data (gitignored)

This folder is intentionally excluded from git — it holds real customer data
(names, ARR, health scores) from Catalyst exports, per Section 9 #11 of the
build plan.

To seed your local dev database with real reference accounts:

1. Export the Catalyst "Whitespace Map" report (Growth view) as CSV.
2. Save it here as `catalyst-whitespace-map.csv`.
3. Run `npm run db:seed`.

Without this file, `npm run db:seed` still creates the dev CSM login but
skips the account import.
