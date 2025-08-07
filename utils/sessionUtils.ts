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
  sessionsBySocket: Map<string, string>
): void {
  const oldSocketId = session.socketId;
  session.socketId = newSocketId;
  session.playerId = newSocketId;
  sessionsBySocket.set(newSocketId, session.playerId);
  
  // Clean up old socket reference
  if (oldSocketId) {
    sessionsBySocket.delete(oldSocketId);
  }
}

// Update game player references after reconnection
export function updateGamePlayerReferences(
  game: Game, 
  sessionId: string, 
  newSocketId: string
): string | null {
  // Find player by session ID in their sessionId property
  const playerEntry = Object.entries(game.players).find(([_, player]) => 
    player.sessionId === sessionId
  );
  
  if (!playerEntry) return null;
  
  const [playerId, playerData] = playerEntry;
  
  // Always just update the socket reference, keep the same player ID
  game.players[playerId].socketId = newSocketId;
  
  return playerId;
}