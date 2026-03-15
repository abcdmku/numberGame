import React from 'react';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { NumberSetup } from './components/NumberSetup';
import { GameBoard } from './components/GameBoard';
import { GameResults } from './components/GameResults';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SoundToggle } from './components/SoundToggle';
import { GameTitle } from './components/GameTitle';
import { GamePhase } from './types/game';

function App() {
  const {
    socketRef,
    gameState,
    gamePhase,
    playerName,
    myNumber,
    error,
    rematchState,
    sessionId,
    isReconnecting,
    isTransitioning,
    opponentStatus,
    joinLobby,
    setNumber,
    makeGuess,
    playAgain,
    generateRandomNumber,
    setError,
    resetToLobby,
    waitForOpponent,
    requestRematch,
    acceptRematch
  } = useSocket();

  const [showReturnConfirm, setShowReturnConfirm] = React.useState(false);

  const handleReturnToLobby = () => {
    if (gamePhase === GamePhase.PLAYING || gamePhase === GamePhase.SETUP) {
      setShowReturnConfirm(true);
    } else {
      resetToLobby();
    }
  };

  const confirmReturnToLobby = () => {
    setShowReturnConfirm(false);
    resetToLobby();
  };

  const cancelReturn = () => {
    setShowReturnConfirm(false);
  };

  const myId = gameState.players.find(p => p.name === playerName)?.id || '';

  // Show reconnecting screen
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Reconnecting...</h2>
          <p className="text-zinc-500 text-sm">Restoring your game session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden select-none">
      <ErrorDisplay error={error} onClose={() => setError('')} />
      <SoundToggle />

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-zinc-300 text-sm">Transitioning...</span>
          </div>
        </div>
      )}

      {/* Return to Lobby Confirmation Dialog */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Leave Game?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to return to the lobby? This will end your current game and disconnect you from your opponent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmReturnToLobby}
                className="w-full sm:flex-1 bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 px-4 rounded-lg font-medium hover:bg-red-500/20 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors duration-200"
              >
                Yes, Leave Game
              </button>
              <button
                onClick={cancelReturn}
                className="w-full sm:flex-1 bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-lg font-medium hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game title header (shown on all non-lobby screens) */}
      {gamePhase !== GamePhase.LOBBY && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 z-40">
          <GameTitle onClick={handleReturnToLobby} />
        </div>
      )}

      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {gamePhase === GamePhase.LOBBY && (
          <Lobby onJoin={joinLobby} />
        )}

        {gamePhase === GamePhase.WAITING && (
          <WaitingRoom
            playerName={playerName}
            opponentStatus={opponentStatus}
            onWaitForOpponent={waitForOpponent}
          />
        )}

        {gamePhase === GamePhase.SETUP && (
          <NumberSetup
            players={gameState.players}
            myId={myId}
            onSetNumber={setNumber}
            onGenerateRandom={generateRandomNumber}
            myNumber={myNumber}
            gameNumber={gameState.gameNumber}
            opponentStatus={opponentStatus}
          />
        )}

        {gamePhase === GamePhase.PLAYING && (
          <GameBoard
            players={gameState.players}
            myId={myId}
            currentTurn={gameState.currentTurn || ''}
            allGuesses={gameState.allGuesses}
            onMakeGuess={makeGuess}
            gameNumber={gameState.gameNumber}
            gameState={gameState}
            opponentStatus={opponentStatus}
            playerName={playerName}
            socket={socketRef.current}
          />
        )}

        {gamePhase === GamePhase.ENDED && (
          <GameResults
            winner={gameState.winner || ''}
            players={gameState.players}
            myId={myId}
            onPlayAgain={playAgain}
            onReturnToLobby={handleReturnToLobby}
            gameNumber={gameState.gameNumber}
            rematchState={rematchState}
            onRequestRematch={requestRematch}
            onAcceptRematch={acceptRematch}
            onJoinLobby={joinLobby}
            playerName={playerName}
            gameState={gameState}
          />
        )}
      </div>
    </div>
  );
}

export default App;
