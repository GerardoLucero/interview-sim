# Interview Sim

Practice technical interviews with an AI that does not go easy on you.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/GerardoLucero/interview-sim/actions/workflows/ci.yml/badge.svg)](https://github.com/GerardoLucero/interview-sim/actions/workflows/ci.yml)

Interview Sim runs realistic mock interviews for software engineers. Choose the type of interview — system design, behavioral, coding, or architecture — select your target level, and have a full conversation with an AI interviewer who asks follow-up questions, pushes back on vague answers, and gives you detailed feedback at the end.

---

## Interview types

| Type | What it covers |
|---|---|
| System Design | Distributed systems, scalability, data modeling, failure modes, operational concerns |
| Behavioral | STAR-method questions on leadership, conflict, failure, cross-functional work, technical decisions with business impact |
| Technical Coding | Algorithmic problems, edge cases, time/space complexity, clean code, practical engineering judgment |
| Architecture | Real architectural challenges: migrations, bottlenecks, technology tradeoffs, team and operational implications |

## Experience levels

Mid, Senior, Staff, Principal — the interviewer calibrates question depth and follow-up pressure to the selected level.

---

## How it works

**The interview** — you send messages, the AI interviewer responds in character. It asks follow-up questions when your answers are too high-level, gives hints when you are stuck, and transitions naturally between topics. It does not break character.

**The evaluation** — when you end the session, `claude-sonnet-4.6` reads the full transcript as a hiring committee member and scores you across five dimensions:

- Technical depth
- Problem-solving approach
- Communication clarity
- Tradeoff reasoning
- Practical experience signal

You get a score for each, your top strengths, concrete improvements with specific advice, an honest verdict, and one actionable thing to study before your next real interview.

---

## Evaluation scoring

| Score | Meaning |
|---|---|
| 80-100 | Strong hire — ready to interview at top-tier companies |
| 65-79 | Hire — solid but with specific gaps to address |
| 50-64 | Lean no — needs targeted improvement |
| Below 50 | No — significant gaps in fundamentals |

---

## Stack

- Next.js 15 (App Router)
- Anthropic AI SDK (`@ai-sdk/anthropic`) — Sonnet for interviewer responses and evaluation
- Prisma with SQLite (local) or PostgreSQL (production)
- TypeScript

---

## Getting started

### Prerequisites

- Node.js 20+
- Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Install

```bash
git clone https://github.com/GerardoLucero/interview-sim.git
cd interview-sim
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL="file:./dev.db"
```

### Set up the database

```bash
npm run db:generate
npm run db:push
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

### POST /api/interview

Start a new interview session or send a message in an existing one.

**Start a session:**

```json
{
  "action": "start",
  "type": "system-design",
  "level": "senior",
  "role": "Software Engineer"
}
```

**Send a message:**

```json
{
  "action": "message",
  "sessionId": "session-1234567890",
  "content": "I would start by designing the data model..."
}
```

**End and evaluate:**

```json
{
  "action": "evaluate",
  "sessionId": "session-1234567890"
}
```

### GET /api/interview?id={sessionId}

Retrieve a session with full message history and evaluation (if completed).

---

## Project structure

```
interview-sim/
├── prisma/
│   └── schema.prisma          Session model
├── src/
│   ├── app/
│   │   └── api/interview/
│   │       └── route.ts       Interview API handler
│   └── lib/
│       ├── db.ts              Prisma client singleton
│       └── interview-engine.ts  Core logic (personas, questions, evaluation)
├── .env.example
└── README.md
```

---

## Deployment

### Vercel

```bash
vercel deploy
```

Set `ANTHROPIC_API_KEY` and `DATABASE_URL` in your Vercel project settings. Use PostgreSQL for production.

---

## Support

Open source, maintained in my spare time. If it was useful and you want to say thanks:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=flat&logo=ko-fi&logoColor=white)](https://ko-fi.com/gerardolucero)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/lucerorios0)

## License

MIT, see [LICENSE](LICENSE).
