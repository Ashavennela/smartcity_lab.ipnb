# Frontend — Smart City Reporting (static)

Files:
- `index.html` — main UI (form + sensor simulator)
- `css/styles.css` — styles
- `js/app.js` — frontend logic; expects backend at `http://127.0.0.1:5000/api`

How to use:
1. Open `index.html` in your browser (double-click or open in VS Code Live Server).
2. Fill the Report Form and submit — it will POST to the backend if running.
3. Use Sensor Simulator to send LDR readings to verify reports.

Evidence:
- Take a screenshot of the form submission showing the Reference ID.
- Start backend and capture email file created under `backend/emails/`.
