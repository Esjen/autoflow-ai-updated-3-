# AutoFlow AI

A visual workflow builder for sales automation. You drag nodes onto a canvas, connect them, and run the flow: a trigger fires, an AI model scores or classifies the incoming enquiry, and the result is routed to Slack, Discord, an HTTP endpoint, or saved as a lead in a built-in pipeline.

Built with Next.js, React Flow and Supabase. This is a working prototype, not a production product (see [Limitations](#limitations)).

## Features

- **Visual builder.** Drag nodes from a palette onto a React Flow canvas, connect them, and edit each node in a settings panel. Changes autosave, with undo and redo.
- **Logic nodes.** If/Condition (true and false branches), Switch, Loop and Delay.
- **Execution engine.** Runs the graph from the trigger, passes data between nodes, supports `{{path.to.value}}` placeholders, and records a step-by-step log for every run.
- **Execution history and analytics.** Each run is saved with its status, duration and logs. The dashboard shows workflow counts by status and a chart.
- **Version history.** A snapshot of the graph is saved on each save, so you can look back at earlier versions.
- **Webhook trigger.** Each workflow gets a secret inbound URL (`/api/webhooks/<token>`). A POST request to it runs the workflow, and the request body is available to the nodes as `data.payload`.
- **Leads pipeline.** A "Create/Update Lead" node saves AI-scored leads to a Leads page with statuses (new, qualified, contacted, won, lost).
- **Read-only share links.** Share a workflow's structure with anyone through a link. Node secrets are stripped from shared views.
- **Per-user API keys.** Users add their own OpenAI, Anthropic or Gemini key in Settings, and the AI node uses it.
- **Authentication and data isolation.** Supabase Auth, with Row Level Security so each user only sees their own data.

### What is real and what is simulated

| Node | Behaviour |
| --- | --- |
| Webhook trigger | Real. Fires when its URL receives a request. |
| Telegram, WhatsApp, Email triggers | Placeholders. Run a flow manually or through the webhook URL. |
| AI (GPT-5.5, Claude, Gemini) | Real calls when you add a matching API key in Settings. Without one, it returns a clearly labelled simulated response. |
| Condition, Switch, Loop, Delay | Real. |
| HTTP Request | Real request to the URL you configure. |
| Slack, Discord | Real message when a webhook URL is set. Otherwise the step is simulated. |
| Create/Update Lead | Real. Writes to the `leads` table. |
| Send Email, Telegram, Google Sheets | Simulated. The step is logged but nothing is sent. |

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui components
- React Flow (`@xyflow/react`) and dnd-kit for the canvas
- Recharts for analytics, Framer Motion for animation
- Supabase: Auth, Postgres and Row Level Security

## Getting started

You need Node.js 22 or later and a free [Supabase](https://supabase.com) project.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the database.** In the Supabase dashboard, open **SQL Editor** and run each file in `supabase/migrations/` in order: `0001`, `0002`, `0003`, `0004`, `0005`. Note that `0001` was reconstructed after the original was lost; it rebuilds the base `workflows` table.

3. **Add your keys.** Copy `.env.example` to `.env.local` and fill in the three values from **Project Settings, API**.

   ```bash
   cp .env.example .env.local
   ```

4. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, sign up, and create a workflow.

### Deploying (for example to Vercel)

1. Import the repository and add the same three environment variables.
2. In Supabase, under **Authentication, URL Configuration**, set the Site URL to your deployed address and add it to the redirect URLs. Without this, login and signup will not work on the live site.
3. Test the whole flow on the deployed URL: sign up, build a workflow, run it, and open a share link.

## Project structure

```
app/                 Pages and API routes (webhooks, execute, share)
components/
  dashboard/         Dashboard, workflow list, leads, settings
  workflow/          Canvas, node palette, node settings, version history
  landing/           Marketing page
lib/
  engine/            Execution engine and safe expression evaluator
  actions/           Supabase data access (workflows, leads, shares, keys)
  supabase/          Browser, server and admin clients
supabase/migrations/ Database schema, in run order
```

## Security notes

- **Row Level Security** is on for every table, so users can only read and write their own rows.
- **The service-role key is server-only.** It is used by the webhook receiver and the share route, and is never sent to the browser.
- **Condition expressions are parsed, not executed.** They go through a small evaluator (`lib/engine/safeExpression.ts`) that can only read from the run's data. They are never passed to `eval` or `new Function`.
- **Share links are locked down.** Anonymous visitors cannot query the workflow tables. The `/api/share/<token>` route returns only what a shared page needs and removes node secrets such as bot tokens and webhook URLs.

## Limitations

- User API keys are stored as plain text in Postgres, protected only by Row Level Security. A production version should encrypt them, for example with Supabase Vault.
- The HTTP Request node can call any URL from the server. A production version should block internal addresses (SSRF) with an allowlist.
- The webhook endpoint has no rate limiting.
- Email, Telegram and Google Sheets actions are simulated.

## Author

John Esonu
