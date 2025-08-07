import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { NumberSetup } from './components/NumberSetup';
import { GameBoard } from './components/GameBoard';
import { GameResults } from './components/GameResults';
import { ErrorDisplay } from './components/ErrorDisplay';
import { SocketDebugger } from './components/SocketDebugger';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md shadow-2xl border border-white/20 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 mx-auto">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Reconnecting...</h2>
          <p className="text-blue-100">Restoring your game session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ErrorDisplay error={error} onClose={() => setError('')} />
      <SocketDebugger socket={socketRef.current} />
      
      {/* Return to Lobby Confirmation Dialog */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Leave Game?</h3>
            <p className="text-blue-100 mb-6">
              Are you sure you want to return to the lobby? This will end your current game and disconnect you from your opponent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmReturnToLobby}
                className="w-full sm:flex-1 bg-red-500/80 backdrop-blur-sm text-white py-3 px-6 rounded-none md:rounded-xl font-semibold hover:bg-red-600/80 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                Yes, Leave Game
              </button>
              <button
                onClick={cancelReturn}
                className="w-full sm:flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-none md:rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to Lobby Button (shown in game states) */}
      {(gamePhase === GamePhase.SETUP || gamePhase === GamePhase.PLAYING) && (
        <button
          onClick={handleReturnToLobby}
          className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md text-white p-3 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Return to Lobby</span>
        </button>
      )}

      {gamePhase === GamePhase.LOBBY && (
        <Lobby onJoin={joinLobby} />
      )}
      
      {gamePhase === GamePhase.WAITING && (
        <>
          <button
            onClick={handleReturnToLobby}
            className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md text-white p-3 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Return to Lobby</span>
          </button>
          <WaitingRoom 
            playerName={playerName} 
            opponentStatus={opponentStatus}
            onWaitForOpponent={waitForOpponent}
          />
        </>
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
  );
}

export default App;