# Medical Supervisor redesign — V1.1

This update rebuilds the Medical Supervisor workspace around the supplied reference screens while keeping the existing React + FastAPI stack.

## Reference-matched screens

- Overview: district banner, greeting, four KPI cards, disease overview, recent alerts, weekly coverage and surveillance pulse.
- Disease Reports: district scope banner, summary cards, filters, report table, pagination, report detail drawer/modal and CSV export.
- Weekly Monitoring: compliance donut, agent counts, follow-up queue, roster, streak/history indicators and reminder actions.
- Risk Map: district-only risk surface with risk counts and taluk-level prediction cards.
- Surveillance Analytics: weekly trend bars, disease burden and interpretation cards.
- Agent Oversight: district agent roster, complaint workflow, proof/evidence upload and previously filed complaints.
- Alerts: risk alerts plus emerging-disease medical review workflow.
- Home Relief: remedy list, filters, status indicators, create/edit drawer, safety rules, approve/reject/delete actions and detail modal.

## District security

The Medical Supervisor account now has a `supervisor_district_id` field. The demo supervisor is assigned to Kodagu (district id 18). Medical Supervisor APIs for overview, reports, monitoring, analytics, risk map, agents, agent issues and emerging disease review are district-scoped on the backend; the frontend does not rely on hiding other districts.

## Working actions

- Disease Reports filters and CSV export.
- Report detail view.
- Weekly reminder creates a district/taluk notification for the assigned agent.
- Agent complaint submission supports multipart proof files; files are stored under `backend/uploads/agent_issues` and their filenames are recorded with the complaint.
- Emerging disease review supports verify-existing, verify-new and reject decisions.
- Home Relief create, edit, approve, reject and delete operations continue through the existing medical APIs, with safety rules preserved.

## Validation performed in this environment

- All React/JS source files were parsed successfully with Babel parser.
- Backend Python source compiled successfully with `python -m compileall`.
- ESLint passed for all newly rewritten Medical Supervisor JSX files with only the repository's React effect/fast-refresh policy overrides used for existing async loading patterns.
- A full Vite production build could not be completed in this Linux validation environment because the uploaded `node_modules` contains the Windows Rolldown native binding and the environment has no network access to install the Linux optional dependency. The source itself parses successfully.
