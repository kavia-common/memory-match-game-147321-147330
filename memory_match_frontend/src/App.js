import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// Ocean Professional theme constants
const THEME_COLORS = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  success: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827'
};

// Card faces using emojis (8 pairs = 16 cards)
const CARD_FACES = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸'];
const GRID_SIZE = 16; // 4x4 grid

/**
 * Fisher-Yates shuffle algorithm to randomize card deck
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Create initial shuffled deck with unique IDs
 * @returns {Array} Array of card objects
 */
const createDeck = () => {
  const pairs = CARD_FACES.flatMap((face, index) => [
    { id: `${index}-a`, face, matched: false },
    { id: `${index}-b`, face, matched: false }
  ]);
  return shuffleArray(pairs);
};

// PUBLIC_INTERFACE
/**
 * Main App component - Memory Match Game
 * Implements a 4x4 grid memory game with flip animations, moves counter,
 * timer, and victory overlay following Ocean Professional theme
 */
function App() {
  // Game state
  const [cards, setCards] = useState(() => createDeck());
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [boardLocked, setBoardLocked] = useState(false);

  // Timer effect - starts when first card is flipped
  useEffect(() => {
    let interval = null;
    if (isGameActive && !isGameWon) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isGameActive && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGameActive, isGameWon, time]);

  // Check for victory condition
  useEffect(() => {
    const allMatched = cards.length > 0 && cards.every((card) => card.matched);
    if (allMatched && moves > 0) {
      setIsGameWon(true);
      setIsGameActive(false);
    }
  }, [cards, moves]);

  // Check for matches when two cards are flipped
  useEffect(() => {
    if (flippedCards.length === 2) {
      setBoardLocked(true);
      const [firstCard, secondCard] = flippedCards;
      
      if (firstCard.face === secondCard.face) {
        // Match found
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === firstCard.id || card.id === secondCard.id
              ? { ...card, matched: true }
              : card
          )
        );
        setFlippedCards([]);
        setBoardLocked(false);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
          setBoardLocked(false);
        }, 1000);
      }
      
      // Increment moves counter
      setMoves((prev) => prev + 1);
    }
  }, [flippedCards]);

  // PUBLIC_INTERFACE
  /**
   * Handle card click event
   * @param {Object} card - The card object that was clicked
   */
  const handleCardClick = useCallback((card) => {
    // Start game on first click
    if (!isGameActive && moves === 0) {
      setIsGameActive(true);
    }

    // Prevent clicks when board is locked or card is already matched/flipped
    if (
      boardLocked ||
      card.matched ||
      flippedCards.find((c) => c.id === card.id)
    ) {
      return;
    }

    // Only allow two cards to be flipped at a time
    if (flippedCards.length < 2) {
      setFlippedCards((prev) => [...prev, card]);
    }
  }, [boardLocked, flippedCards, isGameActive, moves]);

  // PUBLIC_INTERFACE
  /**
   * Restart the game - reset all state and reshuffle cards
   */
  const handleRestart = useCallback(() => {
    setCards(createDeck());
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setIsGameActive(false);
    setIsGameWon(false);
    setBoardLocked(false);
  }, []);

  // Format time for display (MM:SS)
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [time]);

  // Check if card should be shown as flipped
  const isCardFlipped = useCallback((card) => {
    return card.matched || flippedCards.some((c) => c.id === card.id);
  }, [flippedCards]);

  return (
    <div className="App" style={{ backgroundColor: THEME_COLORS.background }}>
      {/* Game Header */}
      <header className="game-header">
        <h1 className="game-title">Memory Match Game</h1>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Moves:</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formattedTime}</span>
          </div>
        </div>

        <button 
          className="restart-button"
          onClick={handleRestart}
          aria-label="Restart game"
        >
          🔄 Restart
        </button>
      </header>

      {/* Game Board */}
      <main className="game-container">
        <div className="cards-grid">
          {cards.map((card) => {
            const flipped = isCardFlipped(card);
            return (
              <button
                key={card.id}
                className={`card ${flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                onClick={() => handleCardClick(card)}
                disabled={boardLocked && !flipped}
                aria-label={flipped ? `Card ${card.face}` : 'Hidden card'}
                aria-pressed={flipped}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <span className="card-icon">{card.face}</span>
                  </div>
                  <div className="card-back">
                    <span className="card-question">?</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Victory Overlay */}
      {isGameWon && (
        <div className="victory-overlay" role="dialog" aria-labelledby="victory-title">
          <div className="victory-modal">
            <h2 id="victory-title" className="victory-title">🎉 Congratulations! 🎉</h2>
            <p className="victory-message">You won the game!</p>
            
            <div className="victory-stats">
              <div className="victory-stat">
                <span className="victory-stat-label">Moves:</span>
                <span className="victory-stat-value">{moves}</span>
              </div>
              <div className="victory-stat">
                <span className="victory-stat-label">Time:</span>
                <span className="victory-stat-value">{formattedTime}</span>
              </div>
            </div>

            <button 
              className="play-again-button"
              onClick={handleRestart}
              aria-label="Play again"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
