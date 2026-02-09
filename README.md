# Job Search Assistant

A browser-based assistant that helps you combine your resume + job-search context with curated prompts, then generates a markdown report using the OpenAI Responses API.

---

## What this app does

- Lets you upload:
  - Resume (required)
  - LinkedIn export/notes (optional)
  - Voice transcript (optional)
  - Job posting (optional)
- Lets you select one or many prebuilt prompts.
- Sends your selected prompt(s) + context to OpenAI.
- Produces one combined markdown document you can review and download.

---

## Quick start (local machine)

### 1) Open a terminal and go to the project folder

```bash
cd /path/to/jobsearch_assistant
```

### 2) Start the local web server

```bash
./scripts/start.sh
```

You should see output like:

```text
Starting Job Search Assistant on http://0.0.0.0:5500
```

### 3) Open the app in your browser

Open:

```text
http://localhost:5500
```

### 4) Use the app

1. Paste your OpenAI API key.
2. Upload your resume (required).
3. Select prompts.
4. Click **Generate Document**.
5. Click **Download Markdown** when complete.

---

## Exact commands to run every time

If you just want the minimum commands:

```bash
cd /path/to/jobsearch_assistant
./scripts/start.sh
```

Then open `http://localhost:5500`.

---

## Stop the app

In the terminal where the server is running, press:

```text
Ctrl + C
```

---

## Codespaces: run automatically on open

Yes — this repo is now set up so GitHub Codespaces starts the app for you.

### What was added

- `.devcontainer/devcontainer.json` now:
  - Starts the server automatically on Codespace startup.
  - Forwards port `5500`.
  - Opens a preview tab when the port is detected.
- `scripts/start.sh` is the shared startup command used locally and in Codespaces.

### What you do in Codespaces

1. Open this repository in Codespaces.
2. Wait for initialization.
3. The app should auto-start and open in the forwarded port preview.

If preview does not pop automatically, open:

```text
https://<your-codespace-name>-5500.app.github.dev
```

(or use the **Ports** panel and open port `5500`).

---

## Troubleshooting

### "python3: command not found"

Install Python 3, then run:

```bash
./scripts/start.sh
```

### Port 5500 already in use

Run with another port:

```bash
PORT=8080 ./scripts/start.sh
```

Then open `http://localhost:8080`.

### OpenAI API errors in output

- Confirm your API key is valid and active.
- The app uses a fixed model (`gpt-5.2`) and does not accept manual model changes.
- Check browser devtools/network for details from the OpenAI API response.


## Deployment-time configuration

The app supports a small runtime configuration object loaded by `config.js`.

- **App defaults** are defined in `config.js` (`defaultAppConfig`).
- **Deployment env config** can override defaults by defining `window.__JOB_ASSISTANT_ENV_CONFIG__` *before* `config.js` runs (for example, via an injected script in your hosting layer).
- **Runtime user content** (uploaded resume/linkedin/voice/job files) is applied at generation time and is treated as the highest-priority content for those sections.

### Supported config fields

- `fixedModel` (string): model used for all OpenAI requests.
- `systemPromptPrefix` (string): system role instruction used in each request.
- `globalContextDocument` (string): deployment-level instructions/context block inserted into prompt assembly.

### Prompt assembly order (precedence chain)

1. **App default config** (`config.js`)
2. **Deployment env config** (`window.__JOB_ASSISTANT_ENV_CONFIG__`)
3. **Runtime user content** (uploaded files in the browser session)

`globalContextDocument` appears in the generated `## Context` block under `### Global Instructions / Context`, and that block is included in every prompt request and final markdown output.

### Example deployment override

```html
<script>
  window.__JOB_ASSISTANT_ENV_CONFIG__ = {
    fixedModel: "gpt-5.2",
    systemPromptPrefix: "You are an enterprise career strategist. Return markdown only.",
    globalContextDocument: "Follow company-safe policy and avoid PII leakage."
  };
</script>
<script src="config.js"></script>
<script src="app.js"></script>
```
