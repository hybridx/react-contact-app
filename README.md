# react-contact-app

A contact manager with a neomorphic (soft UI) design, built with
[Create React App](https://facebook.github.io/create-react-app/docs/getting-started),
React and Bootstrap styling.

## Features

- **Contact-card grid** — a grid of contact cards; clicking a card opens the
  contact detail modal and fills in the contact's details.
- **Contact detail modal** — shows the contact's name, email, phone, address
  and birthday, with Edit and Remove actions in the header.
- **Phone validation** — a phone number may contain digits, spaces and the
  separators `+ - ( )`, and is otherwise rejected. The field is optional: an
  empty value is valid.
- **Email validation** — an email must be a well-formed address such as
  `name@example.com`. The field is optional: an empty value is valid.
- **Accessible inline errors** — invalid values show an inline error message
  wired to the input via `aria-invalid` / `aria-errormessage` and announced
  politely (`role="status"`).
- **Edit protection** — clicking a contact card never clobbers a phone or
  email value the user is typing, and an invalid value is never persisted by
  a card click.

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) (LTS) and npm.

```sh
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests)
for more information.

To run the suite once:

```sh
CI=true npm test
```

The test suite in `src/App.test.js` covers the phone and email validation
rules, the inline error behaviour and the contact-card interactions.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the
best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment)
for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you
can `eject` at any time. This command will remove the single build dependency
from your project.

Instead, it will copy all the configuration files and the transitive
dependencies (webpack, Babel, ESLint, etc) right into your project so you
have full control over them. All of the commands except `eject` will still
work, but they will point to the copied scripts so you can tweak them. At
this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for
small and middle deployments, and you shouldn’t feel obligated to use this
feature.

## Deployment

Pushes to the `develop` branch run the CI workflow in
`.github/workflows/nodejs.yml`, which installs dependencies, builds the app
and deploys the `build` folder to GitHub Pages. The workflow does not yet
run the tests — its intended Test step is malformed (see #29) — so run the
suite locally before pushing.

## Fullsend configuration for GitHub

This repository uses
[fullsend](https://github.com/fullsend-ai/fullsend) — an autonomous agent
automation layer — in per-repo installation mode. It triages issues, opens
implementation PRs, reviews them and applies fixes, all from GitHub events.

### Per-repo configuration

The fullsend configuration lives in [`.fullsend/config.yaml`](.fullsend/config.yaml)
and defines:

- **Tracker** — `tracker.github.allowed_targets`, the repository allow-list
  from the tracker configuration.
- **Runtime** — the agent runtime (`pi`).
- **Roles** — the enabled agent roles: `triage`, `coder`, `review`, `fix`,
  `retro` and `prioritize`.
- **Agents** — the model assignment for each role. The `review` agent also
  maps each review persona (correctness, security, style-conventions, …) to a
  model.
- **Allowed remote resources** — remote origins the agents may fetch from.
- **Inference gateway** — the endpoint the agents call for model inference,
  its authentication mode (`api-key`) and the served models.

A minimal example (see the checked-in file for the full setup):

```yaml
version: "1"
tracker:
    github:
        allowed_targets:
            repos:
                - <owner>/<repo>
runtime: pi
roles:
    - triage
    - coder
    - review
    - fix
inference:
    gateway:
        url: <gateway-url>
        auth: api-key
        models:
            <model-id>:
                api: openai-completions
```

The gateway API key is supplied through the repository's
`FULLSEND_INFERENCE_GATEWAY_API_KEY` secret — never hardcode credentials in
the config file. See the
[layered configuration reference](https://fullsend.sh/docs/guides/infrastructure/layered-config-reference)
for the full schema.

### Workflows

Two GitHub Actions workflows (both managed by fullsend — do not edit them
directly) wire the configuration to GitHub:

- [`.github/workflows/fullsend.yaml`](.github/workflows/fullsend.yaml) — the
  shim workflow. It listens to issue events (opened, edited, labeled), issue
  comments, `pull_request_target` and pull request reviews, and forwards them
  to fullsend's reusable dispatch workflow, which decides which agent role
  runs. It does not check out pull-request code, which limits the risk of
  "pwn request" style credential exfiltration from fork PRs.
- [`.github/workflows/prioritize.yml`](.github/workflows/prioritize.yml) —
  runs the `prioritize` role to score and order work items.

### Using it

Agents are invoked with slash-command comments:

- `/fs-code` on an issue asks the coder agent to implement it; append an
  instruction (for example `/fs-code focus on accessibility`) to guide it.
- `/fs-fix` on a pull request asks the fix agent to address review feedback.
- `/fs-fix-stop` on a pull request disables the fix agent for that PR.

Labeling an issue `ready-to-code` also triggers the coder agent, and the
triage agent runs automatically when an issue is opened or edited.

## Learn More

You can learn more in the
[Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
