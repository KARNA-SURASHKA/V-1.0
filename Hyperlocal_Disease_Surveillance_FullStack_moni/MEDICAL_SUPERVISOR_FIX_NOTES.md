# Medical Supervisor V1.2 – connectivity/runtime fix

## Backend
Run from the project root:

```powershell
cd backend
..\backend\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

You should see:
`Uvicorn running on http://127.0.0.1:8000`

Then open `http://127.0.0.1:8000/health`. It should return `{"ok":true,...}`.

## What was fixed
- `AgentIssueReport` does not contain a `taluk_id` column. The supervisor API now derives taluk/district from the agent assignment.
- `resolved_at` was incorrectly read from `AgentIssueReport`; the real field is `reviewed_at`.
- Legacy `/medical/agent-issues` was fixed as well.
- Local CORS now accepts any localhost/127.0.0.1 development port.
- Frontend API URL follows the frontend hostname by default, with `VITE_API_BASE` override support.
- Added `/health` for a quick backend connectivity test.
