# MiroFish Visualizer

A beautiful web interface for visualizing MiroFish swarm intelligence simulations. Upload seed materials, describe prediction scenarios, and watch thousands of AI agents simulate the future.

## Features

- **Text Input**: Describe what-if scenarios in natural language
- **File Upload**: Upload PDFs, DOCX, or TXT files as seed materials
- **Real-time Visualization**: Interactive network graph of AI agents
- **Event Timeline**: Track simulation events as they unfold
- **Statistics Dashboard**: Monitor convergence, sentiment, and confidence
- **Results Export**: Download simulation reports

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Visualization**: Canvas API + D3.js
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/eulerrelueid-cmyk/mirofish-app.git
cd mirofish-app
npm install
```

### 2. Environment Variables

Use [context/env-reference.md](context/env-reference.md) as the canonical config guide.

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
KIMI_API_KEY=your_kimi_api_key
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## About MiroFish

[MiroFish](https://github.com/666ghj/MiroFish) is an open-source AI prediction engine powered by multi-agent swarm intelligence. It creates high-fidelity digital simulations with thousands of autonomous agents to predict real-world outcomes.

## License

MIT
