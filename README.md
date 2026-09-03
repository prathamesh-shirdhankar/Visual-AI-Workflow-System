# Visual AI Workflow System

A visual AI workflow builder where each node represents an AI decision step that returns either `YES` or `NO`. Workflows are built visually using React Flow and executed through Inngest with Gemini handling the AI decisions.

## Overview

The system allows users to:

- Create AI decision nodes
- Edit the prompt for each node
- Connect nodes using `YES` and `NO` paths
- Execute workflows through Inngest
- Send each node prompt to Gemini
- Receive a strict `YES` or `NO` decision
- Dynamically traverse the workflow based on the AI response
- Track execution order and node results
- Import and export workflows as JSON
- View execution history and logs
- Retry failed execution
- Visually track workflow execution

---

## Tech Stack

- **Next.js** — Frontend application and API routes
- **React Flow** — Visual workflow editor and graph management
- **Inngest** — Durable workflow execution and step management
- **Google Gemini** — AI decision engine
- **TypeScript** — Type-safe application development
- **Tailwind CSS** — UI styling

---

## Architecture

```text
┌─────────────────────┐
│     React Flow      │
│   Visual Workflow   │
└──────────┬──────────┘
           │
           │ Workflow JSON
           ▼
┌─────────────────────┐
│   Next.js API       │
│   /api/execute      │
└──────────┬──────────┘
           │
           │ workflow/execute
           ▼
┌─────────────────────┐
│      Inngest        │
│  Workflow Function  │
└──────────┬──────────┘
           │
           │ step.run()
           ▼
┌─────────────────────┐
│    Gemini AI        │
│    YES / NO         │
└──────────┬──────────┘
           │
           ▼
     Next Node
   YES ─────── NO
```

---

## Project Structure

```text
visual-ai-workflow/
│
├── app/
│   ├── api/
│   │   ├── execute/
│   │   │   ├── route.ts
│   │   │   └── status/
│   │   │       └── route.ts
│   │   └── inngest/
│   │       └── route.ts
│   │
│   └── page.tsx
│
├── components/
│   └── workflow/
│       ├── ExecutionPanel.tsx
│       ├── WorkflowCanvas.tsx
│       └── ...
│
├── inngest/
│   ├── client.ts
│   └── functions/
│       └── executeWorkflow.ts
│
├── lib/
│   ├── ai.ts
│   └── workflow.ts
│
├── types/
│   └── workflow.ts
│
├── public/
│
├── .env.example
├── package.json
├── README.md
└── tsconfig.json
```

---

# Features

## 1. Visual Workflow Editor

The workflow is represented as an interactive React Flow graph.

Users can:

- Add decision nodes
- Move nodes around the canvas
- Edit node prompts
- Connect nodes
- Create separate `YES` and `NO` paths

Example:

```text
             ┌──────────────────┐
             │  Is this a       │
             │  support request? │
             └────────┬─────────┘
                    YES│ │NO
                       │ │
              ┌────────▼─┐ ┌────▼────────┐
              │ Support  │ │   Sales     │
              │  Node    │ │    Node     │
              └──────────┘ └─────────────┘
```

---

## 2. AI Decision Nodes

Each node contains a prompt that is sent to Gemini.

The AI is instructed to return exactly one of:

```text
YES
```

or

```text
NO
```

Responses are validated before they are used for workflow traversal.

Invalid AI responses are treated as execution errors.

---

## 3. Dynamic Workflow Traversal

The workflow does not execute every node.

Instead, the result of the current node determines which edge is followed.

```text
Current Node
     │
     ├── YES ──> YES target node
     │
     └── NO ───> NO target node
```

Execution continues until there is no matching next node.

---

## 4. Inngest Execution

Workflow execution is handled by an Inngest function.

Each AI decision is executed as a durable Inngest step:

```ts
await step.run(`execute-node-${node.id}`, async () => {
  return await askYesNo(node.data.prompt);
});
```

This allows individual workflow nodes to be represented as Inngest steps.

---

## 5. Execution Tracking

Each executed node produces an execution result containing:

```ts
{
  (nodeId, prompt, result, order);
}
```

The system tracks the order in which nodes are executed.

Errors are also recorded against the corresponding node.

---

## 6. Execution Visualization

The frontend supports visual execution state including:

- Running nodes
- Completed nodes
- Failed nodes
- Executed paths
- Animated active edges

An execution panel provides workflow execution information.

---

## 7. Execution History

Previous workflow executions can be stored and displayed as execution history.

Each history entry includes:

- Execution timestamp
- Node results
- Execution order
- Errors, when applicable

---

## 8. Workflow Validation

Before execution, the workflow is validated for common problems such as:

- Empty workflows
- Missing starting node
- Multiple possible starting nodes
- Empty node prompts
- Invalid edge references
- Disconnected nodes

Warnings are shown before execution when appropriate.

---

## 9. JSON Import / Export

Workflows can be represented as JSON containing:

```json
{
  "nodes": [],
  "edges": []
}
```

This allows workflows to be exported, saved, and imported again.

---

# Environment Variables

Create a `.env.local` file in the project root.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
INNGEST_DEV=1
```

Do not commit real API keys to the repository.

Use `.env.example` as the template for required environment variables.

---

# Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Add your Gemini API key to `.env.local`.

---

# Running the Application

## 1. Start Next.js

```bash
npm run dev
```

The application runs at:

```text
http://localhost:3000
```

## 2. Start Inngest Dev Server

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

The Inngest development server should connect to:

```text
http://localhost:3000/api/inngest
```

The application registers the workflow function with Inngest.

---

# Type Checking

Run TypeScript validation with:

```bash
npx tsc --noEmit
```

The project should complete without TypeScript errors.

---

# Example Workflow

A simple workflow could be:

```text
              Is the user asking about support?
                         │
                    ┌────┴────┐
                   YES        NO
                    │          │
                    ▼          ▼
              Support Node   Sales Node
```

For example, the first node might contain:

```text
Is this a support request?
```

Gemini returns:

```text
YES
```

The workflow follows the `YES` edge and executes the connected node.

If Gemini returns:

```text
NO
```

the workflow follows the `NO` edge instead.

---

# API

## Execute Workflow

```http
POST /api/execute
```

Request:

```json
{
  "workflow": {
    "nodes": [],
    "edges": []
  }
}
```

Response:

```json
{
  "eventId": "..."
}
```

---

## Check Execution Status

```http
GET /api/execute/status?eventId=<eventId>
```

The endpoint retrieves the execution status from the local Inngest development server.

---

# Assignment Requirements

## Phase 1 — Setup

- [x] Next.js application
- [x] React Flow
- [x] Inngest
- [x] AI/LLM integration
- [x] Environment configuration
- [x] Project structure
- [x] Running frontend
- [x] Inngest development server
- [x] Repository and README

## Phase 2 — Foundations

- [x] React Flow canvas
- [x] Add nodes
- [x] Connect nodes
- [x] Edit node prompts
- [x] YES path
- [x] NO path
- [x] Local workflow state
- [x] Interactive flow editor
- [x] Editable prompt nodes
- [x] Functional node connections

## Phase 3 — Core Execution

- [x] Inngest workflow execution
- [x] Each node mapped to an Inngest step
- [x] Send prompts to an LLM
- [x] Strict YES/NO AI responses
- [x] Dynamic workflow traversal
- [x] Branch based on AI response
- [x] Execution order tracking
- [x] End-to-end workflow architecture

## Phase 4 — Polish

Implemented multiple polish features:

- [x] Visual execution state
- [x] Execution logs panel
- [x] Workflow save/load support
- [x] JSON export/import
- [x] Improved node styling
- [x] Error handling
- [x] Retry support
- [x] Animated active edges
- [x] Execution history

---

# Validation

TypeScript validation:

```bash
npx tsc --noEmit
```

The project currently passes TypeScript type checking without errors.

The Inngest development server successfully detects the registered workflow function:

```text
visual-ai-workflow
└── execute-workflow
```

---

# Notes

The project uses Gemini as the LLM provider for the AI decision nodes.

The AI decision engine is intentionally restricted to:

```text
YES
NO
```

This keeps the workflow branching deterministic and prevents arbitrary model output from being used as a graph decision.

---

# Author

Visual AI Workflow System

Built as part of the FlyRank AI internship assignment.

```

```
