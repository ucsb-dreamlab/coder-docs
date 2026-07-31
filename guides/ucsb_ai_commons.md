---
title: Using the UCSB AI Commons API with OpenCode and Continue
---
This guide explains how to configure the UCSB AI Commons OpenAI-compatible API for two popular AI coding assistants:

1. **OpenCode** (terminal-based coding agent)
2. **Continue** (VS Code and Positron extension)

## Prerequisites

Before starting, obtain the following from AI Commons:

- AI Commons endpoint (Base URL)
- API key
- Model names

:::{.callout-important}

The API is an add-on feature to the AI Commons that is not present by default. To request API Access, please [submit your request here](https://ucsb.service-now.com/it?id=sc_cat_item&sys_id=05a9143feba583101cfffdf2dad0cdec)

:::

If you have successfully gained API access from ITS, you should see **API Key** as one of the options in your **My Menu** list on the AI Commons portal:

![AI Commons My Menu with API Key option](../images/AI_commons.png)

From there, the API interface will look like this:

![AI Commons API Interface](../images/AI_commons_api.png)

**Model names:** For the full model reference, see the [AI Commons OpenAI-Compatible API Reference](https://aicommons.readme.io/docs/openai#model-resolution). In case AI Commons have models that are not updated in the document, run:

```bash
curl -s https://YOUR-AI-COMMONS-ENDPOINT/v1/models \
  -H "Authorization: Bearer YOUR_AI_COMMONS_API_KEY" \
  | python -c "import sys, json; [print(m['id']) for m in json.load(sys.stdin)['data']]"
```

This prints a clean list of model names, for example:

```
claude-v4.6-sonnet
claude-v4.6-opus
claude-v4.5-haiku
amazon-nova-pro
```

## OpenCode

OpenCode is a terminal-based coding assistant that can be launched from Git Bash, VS Code, or Positron.

### Step 1. Install OpenCode

Follow the [installation instructions on the OpenCode website](https://opencode.ai/docs#install).

Verify the installation:

```bash
opencode --version
```

### Step 2. Configure OpenCode

Open the global configuration file:

```text
~/.config/opencode/opencode.json
```

Example configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "my-custom-provider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "AI Commons",
      "options": {
        "baseURL": "https://YOUR-AI-COMMONS-ENDPOINT/v1",
        "apiKey": "YOUR_AI_COMMONS_API_KEY"
      },
      "models": {
        "claude-v4.5-haiku": {
          "name": "claude-v4.5-haiku"
        },
        "claude-v4.6-sonnet": {
          "name": "claude-v4.6-sonnet"
        },
        "claude-v4.6-opus": {
          "name": "claude-v4.6-opus"
        }
      }
    }
  }
}
```

Replace:

- `https://YOUR-AI-COMMONS-ENDPOINT/v1`
- `YOUR_AI_COMMONS_API_KEY`


### Step 3. Start OpenCode

Launch OpenCode from your project directory by running the following command in any terminal — the integrated terminal in VS Code or Positron, or a standalone terminal all work:

```bash
opencode
```

Inside OpenCode you can see available models:

```text
/models
```

You are all set. Start chatting with the model directly in your terminal.


## Continue (VS Code and Positron)

Continue is an IDE extension that provides chat and coding-agent capabilities for both VS Code and Positron.

### Step 1. Install Continue

Open the Extensions panel and search for the Continue extension published by **Continue**:

```text
Continue - open-source AI code Agent
```


:::{.callout-note }

In Positron, installation may fail with a version mismatch error. If this happens, follow the guidance shown in the Notification panel (bottom right corner) and install it manually via `Ctrl+Shift+P` → **Extensions: Install from VSIX**.

:::

### Step 2. Configure AI Commons

The user configuration file is located at:

```text
~\.continue\config.yaml
```

Alternatively, you can open it directly from within the IDE:

1. Click the **Continue** extension icon in the sidebar to open the Continue panel.
2. Click the **settings icon** (top right corner of the Continue panel).
3. Select **Configs** on the left side of the settings panel.
4. Click **Main Config** to open the configuration file.

Paste the following into your config:

Example configuration:

```yaml
name: UCSB AI Commons
version: 1.0.0
schema: v1

models:
  - name: Claude Sonnet 4.6
    provider: openai
    model: claude-v4.6-sonnet
    apiBase: https://YOUR-AI-COMMONS-ENDPOINT/v1
    apiKey: YOUR_AI_COMMONS_API_KEY

  - name: Claude Opus 4.6
    provider: openai
    model: claude-v4.6-opus
    apiBase: https://YOUR-AI-COMMONS-ENDPOINT/v1
    apiKey: YOUR_AI_COMMONS_API_KEY

  - name: Claude Haiku 4.5
    provider: openai
    model: claude-v4.5-haiku
    apiBase: https://YOUR-AI-COMMONS-ENDPOINT/v1
    apiKey: YOUR_AI_COMMONS_API_KEY

    roles:
      - chat
      - edit

    capabilities:
      - tool_use
```

Replace:

- `https://YOUR-AI-COMMONS-ENDPOINT/v1`
- `YOUR_AI_COMMONS_API_KEY`

You are all set. Open the Continue panel in your IDE and start chatting with your models.

---

## Authentication Problems

Verify:

- Base URL is correct.
- `/v1` is not duplicated.
- API key is valid.
- No extra spaces exist in the key.


