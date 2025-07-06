# PlotWeaver Web Frontend

Modern React frontend for PlotWeaver AI-assisted novel writing platform.

## Architecture

- **Frontend**: React + Next.js with TypeScript
- **Backend Integration**: Next.js API routes proxy to PlotWeaver Python backend (pw2)
- **State Management**: Zustand + React Query
- **UI Components**: Tailwind CSS + Radix UI

## Development

Install frontend dependencies:
```bash
cd frontend && npm install
```

Run the development server:
```bash
npm run dev
```

This starts the React frontend on http://localhost:3000 (or 5173 with Vite)

## Backend Connection

This frontend connects to the main PlotWeaver backend at `/home/tmcfar/dev/pw2`.
The Python backend should be running separately.

## Build & Deploy

Build frontend:
```bash
npm run build
```

Preview build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components  
│   ├── app/           # Next.js app router
│   ├── lib/           # Utilities and API clients
│   └── hooks/         # Custom React hooks
├── public/            # Static assets
└── package.json       # Frontend dependencies
```