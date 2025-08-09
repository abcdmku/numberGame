import type { PlayerSession, Game, Player } from '../types/game.js';

// Clean up player name from used names map
export function cleanupPlayerName(socketId: string, usedNames: Map<string, string>): void {
  if (usedNames.has(socketId)) {
    const playerName = usedNames.get(socketId);
    usedNames.delete(socketId);
    console.log(`Removed name "${playerName}" for socket ${socketId}`);
  }
}

// Find game by player ID
export function findGameByPlayerId(playerId: string, activeGames: Map<string, Game>): Game | undefined {
  return Array.from(activeGames.values()).find(game => 
    game.players[playerId]
  );
}

// Update session with new socket information
export function updateSessionSocket(
  session: PlayerSession, 
  newSocketId: string, 
  sessionsBySocket: Map<string, string>,
  sessionId: string
): void {
  const oldSocketId = session.socketId;
  session.socketId = newSocketId;
  // Don't change playerId here - let updateGamePlayerReferences handle it
  sessionsBySocket.set(newSocketId, sessionId);
  
  // Clean up old socket reference
  if (oldSocketId) {
    sessionsBySocket.delete(oldSocketId);
  }
}

// Find player by their current socket ID
export function findPlayerBySocketId(game: Game, socketId: string): Player | null {
  return Object.values(game.players).find(player => player.socketId === socketId) || null;
}

// Get player ID by their current socket ID
export function getPlayerIdBySocketId(game: Game, socketId: string): string | null {
  const playerEntry = Object.entries(game.players).find(([, player]) => player.socketId === socketId);
  return playerEntry ? playerEntry[0] : null;
}

// Update game player references after reconnection
export function updateGamePlayerReferences(
  game: Game, 
  sessionId: string, 
  newSocketId: string
): string | null {
  // Find player by session ID in their sessionId property
  const playerEntry = Object.entries(game.players).find(([, player]) => 
    player.sessionId === sessionId
  );
  
  if (!playerEntry) return null;
  
  const [oldPlayerId] = playerEntry;
  
  // Just update the socketId field - keep everything else the same
  game.players[oldPlayerId].socketId = newSocketId;
  
  // Return the original player ID (which stays the same)
  return oldPlayerId;
}