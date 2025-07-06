# PlotWeaver Frontend - Week 1 Implementation

## 🎉 What's Been Implemented

### Enhanced Components
- **Enhanced WebSocket Hook** - Channel-based subscriptions, auto-reconnection, message queuing
- **ModeSetSelector** - Visual mode switching with migration warnings and feature previews
- **Enhanced LockIndicator** - Tooltips, override requests, collaborative indicators
- **LockManagementPanel** - Tree view, bulk operations, audit trail
- **ConflictResolutionDialog** - AI suggestions, side-by-side comparison, manual resolution

### Backend Integration
- **WebSocket Channels** - Real-time lock updates and conflict notifications
- **Lock API Endpoints** - CRUD operations for component locks
- **Mode-Set Management** - User preference handling

### State Management
- **Global Store** - Enhanced Zustand store with user, project, and UI state
- **API Clients** - Lock and mode-set API services with caching

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (required for Next.js 15)
- Python 3.12+ (for backend)

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../
pip install -r requirements.txt
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend: npm run dev:backend
# Frontend: npm run dev:frontend
```

### Testing

```bash
# Run the Week 1 implementation test
cd frontend
chmod +x test-week1.sh
./test-week1.sh
```

## 🏗️ Architecture

```
User → Next.js (3000) → FastAPI (8000) → PlotWeaver Backend (pw2)
```

### WebSocket Channels
- `locks:{projectId}` - Real-time lock updates
- `conflicts:{projectId}` - Conflict notifications
- `subscribe:{projectId}` - Project subscription management

### API Endpoints
- `GET /api/projects/{id}/locks` - Get project locks
- `PUT /api/projects/{id}/locks/{componentId}` - Update component lock
- `POST /api/projects/{id}/conflicts/{id}/resolve` - Resolve conflicts
- `GET /api/user/mode-set` - Get user mode-set preferences

## 🧪 Testing Features

### Mode-Set Switching
1. Start the app - you'll see mode-set selection cards
2. Choose a mode (Professional Writer, AI-First, etc.)
3. Use the mode selector in the top bar to switch modes
4. Migration warnings appear when switching between incompatible modes

### Lock Management
1. Click the "🔒 Locks" button in the top bar to open the Lock Management Panel
2. Use checkboxes to select components in the tree view
3. Apply bulk lock operations (Soft Lock, Hard Lock, Freeze)
4. Individual components show lock indicators with tooltips

### Real-time Features
1. Open multiple browser windows/tabs
2. Lock a component in one window
3. See the lock appear immediately in other windows
4. WebSocket connection status shows in the top bar

### Conflict Resolution
1. Create a conflict by requesting an override on a locked component
2. Click the "⚠️ Conflicts" button when it appears
3. Use the conflict resolution dialog with AI suggestions
4. Choose manual resolution options or apply AI recommendations

## 🔧 Configuration

### Environment Variables
Create `.env.local` in the frontend directory:

```bash
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Mode-Set Configuration
Mode-sets are defined in `app/page.tsx` with:
- **Professional Writer**: Full control, all features
- **AI-First**: Simplified UI, auto-generation focus  
- **Editor**: Read-only, review and annotation tools
- **Hobbyist**: Gamified, community features

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy to FastAPI)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── src/
│   ├── components/
│   │   ├── mode-sets/     # Mode-set selection components
│   │   └── locks/         # Lock management components
│   ├── hooks/
│   │   └── useWebSocket.ts # Enhanced WebSocket hook
│   └── lib/
│       ├── api/           # API client services
│       └── store/         # Global state management
└── test-week1.sh          # Implementation test script
```

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Ensure FastAPI backend is running on port 8000
- Check CORS configuration allows localhost:3000

**TypeScript Errors**
- Run `npm run type-check` to see detailed errors
- Ensure all dependencies are installed

**Build Failures**
- Check Node.js version (requires 20+)
- Clear Next.js cache: `rm -rf .next`

**Lock Operations Not Working**
- Verify backend is running and accessible
- Check browser console for API errors
- Ensure WebSocket connection is established

### Performance
- WebSocket reconnection: Max 5 attempts with exponential backoff
- Lock state cached client-side with event-driven invalidation
- Optimistic updates for responsive UI

## 🔜 Next Steps (Week 2)

Based on the specification, Week 2 will implement:
1. **Enhanced State Management** - Lock store with Zustand
2. **API Integration Layer** - Optimistic updates and caching
3. **Real-time Notifications** - Toast system for lock changes
4. **Conflict Prevention** - Pre-validation before operations

## 📝 Notes

- All components include comprehensive TypeScript types
- WebSocket implementation supports both legacy (string) and modern (channel-based) messages
- Lock management includes audit trail and collaborative features
- Mode-set system ready for advanced workflow customization

## 🤝 Contributing

When adding new features:
1. Follow the component structure in `/src/components/`
2. Add TypeScript types to `/src/lib/api/`
3. Update the global store for state management
4. Include WebSocket channels for real-time features
5. Test with the Week 1 test script