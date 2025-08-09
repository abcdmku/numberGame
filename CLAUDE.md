# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start full development environment (server + client)
- `npm run server` - Start only the Express/Socket.io server (port 3001)  
- `npm run client` - Start only the Vite dev server (port 5173)
- `npm run build` - Build for production (includes version update)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture Overview

This is a real-time multiplayer number guessing game built with:

**Backend (server.ts)**
- Express.js server with Socket.io for real-time communication
- Game state management with in-memory storage using Maps
- Session-based reconnection system allowing players to rejoin after disconnects
- Port 3001 for server, serves static files in production

**Frontend (React + Vite)**  
- Single-page React application with TypeScript
- Socket.io client for real-time communication with server
- Tailwind CSS for styling with glassmorphism design
- Vite dev server on port 5173 in development

**Game Flow**
- Players join lobby → waiting room → number setup → gameplay → results
- Game phases managed by `GamePhase` enum: LOBBY → WAITING → SETUP → PLAYING → ENDED
- State managed through custom `useSocket` hook

**Key Architectural Patterns**
- Dual type definitions: `/types/game.ts` (server-side) and `/src/types/game.ts` (client-side) 
- Shared utilities in `/utils/` for game logic (gameUtils.ts) and session management (sessionUtils.ts)
- Socket event handlers centralized in server.ts with game state stored in Maps
- Session persistence allows reconnection during active games
- Component-based UI with each game phase having its own component

**Socket Events Architecture**
- Server manages all game state, clients send actions and receive state updates
- Reconnection handled via session IDs that persist when sockets disconnect
- Real-time updates for opponent actions, game state changes, and connection status

## Key Files

- `server.ts` - Main server file with all Socket.io event handlers
- `src/hooks/useSocket.ts` - Central state management and socket communication
- `src/App.tsx` - Main component with game phase routing
- `types/game.ts` & `src/types/game.ts` - Type definitions (server/client)
- `utils/gameUtils.ts` - Game logic, number validation, feedback calculation
- `utils/sessionUtils.ts` - Session and player management utilities