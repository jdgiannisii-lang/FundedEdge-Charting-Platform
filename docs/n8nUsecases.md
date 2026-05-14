# n8n Use Cases — FundedEdge Charting Platform

## Core Concepts

**Workflows** — the main unit. A workflow is a chain of nodes triggered by an event.

**Nodes** — individual steps. Three types:
- **Trigger nodes** — start the workflow (webhook, schedule, app event)
- **Action nodes** — do something (HTTP request, send Slack message, write to DB)
- **Transform nodes** — reshape data (Code, Set, If, Merge, Loop)

**Executions** — each time a workflow runs. Inspect every execution's input/output in the UI at `http://localhost:5678`.

---

## The UI in 60 Seconds

| Area | What it does |
|---|---|
| **Canvas** | Drag nodes, wire them together |
| **Left sidebar** | Node library — search any service |
| **Top bar** | Save, Activate (toggle), Execute manually |
| **Executions tab** | Full log of every run, with data at each step |
| **Credentials** | Global store for API keys, OAuth tokens |

---

## What FundedEdge Should Use n8n For

### 1. Market Data Pipelines
Fetch OHLCV data from your data provider on a schedule, normalize it, store it in your DB.

```
[Schedule Trigger] → [HTTP Request: fetch candles] → [Code: normalize] → [Postgres/Supabase node: upsert]
```

### 2. Alert System → Slack
Slack DM channel: `D0B2ZUUG0PQ` (workspace: `fundededge.slack.com`)

```
[Webhook or Schedule] → [HTTP Request: check signal] → [If: condition met?]
    → Yes → [Slack: send DM to D0B2ZUUG0PQ]
    → No  → [NoOp]
```

### 3. Webhook-Driven Triggers
Your charting platform POSTs to n8n webhooks to kick off backend workflows:

- Chart pattern detected → n8n webhook → Slack alert
- Trade signal fired → n8n → log to DB + notify
- User action on platform → n8n → enrich data + respond

Webhook URL format: `http://localhost:5678/webhook/<your-path>`

### 4. Scheduled Sync / Cron Jobs
Replace hand-rolled cron scripts with n8n schedules:

```
[Cron: every 1 min] → [HTTP Request: your API] → [Code: process] → [DB write]
```

### 5. Error Monitoring & Retries
- Enable **"Retry on Fail"** on any node (right-click → Settings)
- Add an **Error Trigger** workflow that catches failures and DMs you on Slack

---

## Key Nodes for a Charting Platform

| Node | Use Case |
|---|---|
| **HTTP Request** | Call any REST API (market data, your own backend) |
| **Webhook** | Receive events from your platform |
| **Schedule Trigger** | Cron jobs (every minute, hourly, etc.) |
| **Code** | Custom JS/Python logic — indicator math, data transforms |
| **If / Switch** | Branch on conditions (signal thresholds, alert levels) |
| **Slack** | Send DMs or channel messages |
| **Postgres / Supabase** | Direct DB read/write |
| **Set** | Shape/rename fields between nodes |
| **Merge** | Combine data from multiple sources |
| **Loop Over Items** | Batch process multiple instruments/candles |

---

## Credentials Setup (Do This First)

Go to **Settings → Credentials → Add Credential** for:

1. **Slack** — OAuth2, connect to `fundededge.slack.com`
2. **Postgres/Supabase** — DB connection string
3. **Your data provider** — API key (HTTP Request node supports header auth)

Once saved, credentials are reusable across all workflows — never paste API keys into nodes directly.

---

## Practical Workflow Patterns

**Polling + Dedup**
```
[Cron] → [HTTP: fetch data] → [Code: hash each record]
→ [Postgres: check if hash exists] → [If new] → [Insert + alert]
```

**Webhook → Validate → Act**
```
[Webhook] → [Code: validate signature] → [If valid]
→ [Switch on event_type]
  → "signal"  → [Slack DM]
  → "error"   → [Slack DM + log]
  → "sync"    → [DB write]
```

**Fan-out across instruments**
```
[Cron] → [Set: instrument list] → [Loop Over Items]
  → [HTTP: fetch per symbol] → [Code: calculate] → [DB upsert]
```

---

## Production Tips

- **Activate vs. Manual Execute** — "Execute" runs once for testing. Flip the **Active** toggle for production.
- **Keep n8n running** — Currently a background process. For production, run as a Windows service or use Docker.
- **Environment variables** — Set sensitive config via `N8N_*` env vars instead of hardcoding in nodes.
- **Execution pruning** — Set `EXECUTIONS_DATA_MAX_AGE=168` (hours) to auto-prune history.
- **External webhooks** — If your charting platform is external, expose n8n via a tunnel (e.g., `ngrok http 5678`) or deploy to a server.

---

## Immediate Next Steps for FundedEdge

1. Open `http://localhost:5678` and finish the owner account setup
2. Add Slack credential (connect to `fundededge.slack.com`)
3. Build a test workflow: **Cron → HTTP Request → Slack DM to `D0B2ZUUG0PQ`**
4. Wire the charting platform to POST events to an n8n webhook
