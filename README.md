# Visual AI Workflow System

A visual workflow builder where each node is an AI decision point. Each node sends a prompt to an LLM, receives a strict YES or NO answer, and follows the corresponding edge to the next node — continuing until the workflow reaches an endpoint.

## Tech Stack

- Next.js (App Router) + TypeScript
- React Flow (`@xyflow/react`) — visual workflow canvas
- Inngest — workflow execution engine
- OpenAI SDK — AI decision nodes
- shadcn/ui + Tailwind CSS — UI components

## Getting Started

1. Copy `.env.example` to `.env.local` and add your OpenAI API key.
2. Install dependencies:
