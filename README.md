# Backend — Smart City Report (Flask)

Requirements
- Python 3.10+
- Install packages from `requirements.txt` (recommend virtualenv)

Quick start (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env to configure SMTP if you want real emails
python app.py
```

The app will run on http://127.0.0.1:5000 by default. It exposes:
- GET /api/health
- GET /api/issues -> list issues
- POST /api/issues -> create a report (JSON)
- GET /api/issues/<ref_id> -> get specific
- POST /api/sensor -> accept sensor JSON: {ref_id, lux, timestamp?}

Emails: If SMTP is not configured, outgoing emails are written to `backend/emails/*.eml` for screenshot evidence.
