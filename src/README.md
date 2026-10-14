# Source layout

- `main.js`: application entry point, shared state, navigation, and page wiring.
- `components/`: reusable dropdowns, date and colour pickers, icons, and popup interaction helpers.
- `features/`: grades, terms, backup import, and changelog rendering.
- `services/`: Supabase access and local/cloud workspace preservation.
- `data/`: course type colours and one-time curriculum imports.
- `styles/app.css`: application styles.

Release notes are maintained in the root `CHANGELOG.md`. The app version comes
from the root `package.json`. Saved user data lives in local storage and Supabase,
not in these source files.
