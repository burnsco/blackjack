import React, { useState, useEffect, useCallback } from 'react';
import { createDeck, shuffleDeck, calculateHandValue, type Card, type Suit, type Rank } from '../lib/blackjack';
import { Coins, RotateCcw, Play, Hand, User, Bot, AlertCircle, ArrowUpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'betting' | 'player_turn' | 'dealer_turn' | 'result';

const CardUI = ({ card, hidden = false, index = 0 }: { card?: Card; hidden?: boolean; index?: number }) => {
  // Add a natural fan rotation (staggered)
  const rotation = hidden ? 0 : (index * 10) - 10; // -10, 0, 10, 20... degrees

  if (hidden) {
    return (
      <div 
        style={{ transform: `rotate(${rotation}deg)` }}
        className="w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 bg-indigo-950 rounded-lg shadow-2xl border-2 sm:border-4 border-white flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-1 ring-black/20 transition-transform duration-300"
      >
        <div className="absolute inset-1.5 border-2 border-white/20 rounded-md bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.08)_8px,rgba(255,255,255,0.08)_16px)]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/60"></div>
        <div className="text-white/30 text-3xl md:text-5xl font-serif italic z-10 font-black tracking-tighter drop-shadow-lg">BJ</div>
      </div>
    );
  }

  if (!card) return null;

  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const getSuitColor = (suit: Suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-rose-600' : 'text-slate-900';
  };

  return (
    <div 
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 bg-white rounded-lg shadow-2xl p-1.5 sm:p-2.5 flex flex-col justify-between flex-shrink-0 ring-1 ring-black/20 relative overflow-hidden transition-all duration-300 hover:-translate-y-8 hover:rotate-0 hover:z-50 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] cursor-default ${getSuitColor(card.suit)}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-200 opacity-90 pointer-events-none"></div>
      <div className="font-bold text-sm sm:text-lg md:text-xl leading-none z-10 drop-shadow-sm">{card.rank}</div>
      <div className="self-center text-3xl sm:text-5xl z-10 drop-shadow-md">{getSuitSymbol(card.suit)}</div>
      <div className="font-bold text-sm sm:text-lg md:text-xl self-end rotate-180 leading-none z-10 drop-shadow-sm">{card.rank}</div>
    </div>
  );
};

export default function BlackjackGame() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [bankroll, setBankroll] = useState(1000);
  const [currentBet, setCurrentBet] = useState(10);
  const [roundBet, setRoundBet] = useState(0);
  const [message, setMessage] = useState('Place your bet!');

  useEffect(() => {
    setDeck(shuffleDeck(createDeck()));
  }, []);

  const endRound = useCallback((forcedResult?: 'bust' | 'blackjack' | 'dealer_blackjack', finalPlayerHand?: Card[], finalDealerHand?: Card[], specificRoundBet?: number) => {
    const pHand = finalPlayerHand || playerHand;
    const dHand = finalDealerHand || dealerHand;
    const wager = specificRoundBet || roundBet;
    
    const pVal = calculateHandValue(pHand);
    const dVal = calculateHandValue(dHand);
    
    setGameState('result');

    if (forcedResult === 'bust') {
      setMessage('Bust! Dealer wins.');
    } else if (forcedResult === 'blackjack') {
      setMessage('Blackjack! You win 3:2!');
      setBankroll(prev => prev + wager * 2.5);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else if (forcedResult === 'dealer_blackjack') {
      setMessage('Dealer has Blackjack! You lose.');
    } else if (dVal > 21) {
      setMessage('Dealer busts! You win!');
      setBankroll(prev => prev + wager * 2);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (pVal > dVal) {
      setMessage('You win!');
      setBankroll(prev => prev + wager * 2);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (pVal < dVal) {
      setMessage('Dealer wins.');
    } else {
      setMessage('Push (Draw).');
      setBankroll(prev => prev + wager);
    }
  }, [playerHand, dealerHand, roundBet]);

  const startNewRound = () => {
    if (bankroll < currentBet) {
      setMessage("You're out of money!");
      return;
    }

    const newDeck = deck.length < 15 ? shuffleDeck(createDeck()) : [...deck];
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    const initialPlayerHand = [p1, p2];
    const initialDealerHand = [d1, d2];
    const pVal = calculateHandValue(initialPlayerHand);
    const dVal = calculateHandValue(initialDealerHand);

    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(newDeck);
    setBankroll(prev => prev - currentBet);
    setRoundBet(currentBet);

    if (pVal === 21 && dVal === 21) {
      endRound(undefined, initialPlayerHand, initialDealerHand, currentBet);
    } else if (pVal === 21) {
      endRound('blackjack', initialPlayerHand, initialDealerHand, currentBet);
    } else if (dVal === 21) {
      endRound('dealer_blackjack', initialPlayerHand, initialDealerHand, currentBet);
    } else {
      setGameState('player_turn');
      setMessage('Your turn');
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setPlayerHand(newHand);
    setDeck(newDeck);

    const val = calculateHandValue(newHand);
    if (val > 21) {
      endRound('bust', newHand);
    } else if (val === 21) {
      setGameState('dealer_turn');
    }
  };

  const doubleDown = () => {
    if (bankroll < roundBet) {
      setMessage("Not enough chips to double down!");
      return;
    }

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setBankroll(prev => prev - roundBet);
    setRoundBet(prev => prev * 2);
    setPlayerHand(newHand);
    setDeck(newDeck);

    const val = calculateHandValue(newHand);
    if (val > 21) {
      endRound('bust', newHand, dealerHand, roundBet * 2); 
    } else {
      setGameState('dealer_turn');
    }
  };

  const stand = useCallback(() => {
    setGameState('dealer_turn');
  }, []);

  useEffect(() => {
    if (gameState === 'dealer_turn') {
      const dealerValue = calculateHandValue(dealerHand);
      if (dealerValue < 17) {
        const timer = setTimeout(() => {
          const newDeck = [...deck];
          const newCard = newDeck.pop()!;
          const nextDealerHand = [...dealerHand, newCard];
          setDealerHand(nextDealerHand);
          setDeck(newDeck);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        endRound(undefined, playerHand, dealerHand);
      }
    }
  }, [gameState, dealerHand, deck, playerHand, endRound]);

  const surrender = () => {
    setBankroll(prev => prev + Math.floor(roundBet / 2));
    setGameState('result');
    setMessage('Surrendered. Half bet returned.');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-emerald-800/40 to-slate-900/60 backdrop-blur-3xl sm:rounded-3xl shadow-[0_0_80px_-20px_rgba(0,0,0,0.6)] text-white font-sans relative z-10 border border-white/10 ring-1 ring-white/5 overflow-hidden">
      
      {/* Header Area */}
      <div className="flex justify-between items-center p-4 sm:p-6 pb-4 border-b border-white/5 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter flex items-center gap-2 drop-shadow-2xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-900/20">
              <Coins className="text-yellow-950 w-5 h-5" /> 
            </div>
            <span className="bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">THE TABLE</span>
          </h2>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="bg-black/40 pl-4 pr-1 py-1 rounded-full flex items-center gap-3 border border-white/5 shadow-inner backdrop-blur-md">
            <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-[0.2em]">Bankroll</span>
            <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="text-lg sm:text-xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">${bankroll}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 flex flex-col justify-center sm:justify-evenly gap-2 sm:gap-4 p-4 sm:p-6 relative min-h-0 overflow-hidden">
        {/* Subtle table markings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05]">
          <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] border-[20px] border-white rounded-full blur-2xl"></div>
          <div className="absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] border-[1.5px] border-emerald-400/20 rounded-full"></div>
        </div>

        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="flex items-center gap-2 text-emerald-300/60 italic">
            <Bot size={16} className="sm:w-5 sm:h-5" />
            <span className="uppercase text-[9px] sm:text-xs font-black tracking-[0.2em] drop-shadow-sm">The Dealer</span>
            {gameState !== 'betting' && (
              <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono border border-white/10 backdrop-blur-md">
                {gameState === 'player_turn' && dealerHand.length > 0 ? '??' : calculateHandValue(dealerHand)}
              </span>
            )}
          </div>
          <div className="flex justify-center h-24 sm:h-32 md:h-36">
            {dealerHand.map((card, i) => (
              <div key={i} className={`animate-in fade-in slide-in-from-top-8 duration-500 relative ${i > 0 ? '-ml-4 sm:-ml-6 md:-ml-8' : ''}`}>
                <CardUI card={card} hidden={gameState === 'player_turn' && i === 1} index={i} />
              </div>
            ))}
            {dealerHand.length === 0 && (
              <div className="w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 border-2 border-dashed border-emerald-400/10 rounded-xl flex items-center justify-center bg-black/10">
                <div className="w-8 h-8 rounded-full border border-emerald-400/10 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center py-1 z-20 h-10 flex items-center justify-center">
          <div className={`inline-block bg-white/5 backdrop-blur-2xl px-6 py-1.5 sm:px-10 sm:py-2 rounded-full text-base sm:text-lg font-black border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white tracking-widest transition-all duration-300 ${gameState === 'result' ? 'scale-110 bg-emerald-500/10 border-emerald-500/30 font-black' : 'animate-pulse'}`}>
            {message}
          </div>
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="flex justify-center h-24 sm:h-32 md:h-36">
            {playerHand.map((card, i) => (
              <div key={i} className={`animate-in fade-in slide-in-from-bottom-8 duration-500 relative ${i > 0 ? '-ml-4 sm:-ml-6 md:-ml-8' : ''}`}>
                <CardUI card={card} index={i} />
              </div>
            ))}
            {playerHand.length === 0 && (
              <div className="w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 border-2 border-dashed border-emerald-400/10 rounded-xl flex items-center justify-center bg-black/10">
                <div className="w-8 h-8 rounded-full border border-emerald-400/10 animate-pulse"></div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-emerald-300/60 italic">
              <User size={16} className="sm:w-5 sm:h-5" />
              <span className="uppercase text-[9px] sm:text-xs font-black tracking-[0.2em] drop-shadow-sm">Your Hand</span>
              {playerHand.length > 0 && (
                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono border border-white/10 backdrop-blur-md">
                  {calculateHandValue(playerHand)}
                </span>
              )}
            </div>
            {gameState !== 'betting' && roundBet > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 px-4 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                <span className="text-yellow-400 font-black text-[10px] sm:text-xs tracking-widest">
                  WAGERED: ${roundBet}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Area (Pinned to Bottom) */}
      <div className="bg-black/60 p-4 sm:p-6 pb-6 sm:pb-8 border-t border-white/10 shrink-0 z-50">
        {gameState === 'betting' ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full max-w-3xl mx-auto">
            {bankroll < 10 && currentBet > bankroll ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <p className="text-rose-400 font-black text-base italic tracking-tight drop-shadow-2xl">OUT OF CHIPS</p>
                <button 
                  onClick={() => {
                    setBankroll(1000);
                    setCurrentBet(10);
                    setMessage('Bankroll recharged! Place your bet.');
                  }}
                  className="bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-sm shadow-xl border border-white/10"
                >
                  <Coins size={18} /> RECHARGE $1000
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-4 justify-center">
                  {[10, 50, 100, 500].map(amt => {
                    const getChipColor = (value: number) => {
                      switch (value) {
                        case 10: return 'bg-blue-600 border-blue-400';
                        case 50: return 'bg-rose-600 border-rose-400';
                        case 100: return 'bg-slate-900 border-slate-700';
                        case 500: return 'bg-yellow-500 border-yellow-300 text-yellow-950';
                        default: return 'bg-emerald-600 border-emerald-400';
                      }
                    };

                    const isSelected = currentBet === amt;
                    const isDisabled = bankroll < amt;

                    return (
                      <button
                        key={amt}
                        onClick={() => setCurrentBet(amt)}
                        disabled={isDisabled}
                        className={`group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[5px] flex items-center justify-center font-black transition-all shadow-xl hover:-translate-y-2 active:translate-y-0 disabled:opacity-20 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed text-xs sm:text-base ${getChipColor(amt)} ${isSelected ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-black scale-110 z-10' : ''}`}
                      >
                        <div className={`absolute inset-0.5 border border-dashed rounded-full opacity-30 ${amt === 500 ? 'border-yellow-900' : 'border-white'}`}></div>
                        <span className="relative z-10 drop-shadow-lg">${amt}</span>
                      </button>
                    )
                  })}
                </div>
                <button 
                  onClick={startNewRound}
                  disabled={bankroll < currentBet}
                  className="group bg-gradient-to-br from-yellow-300 to-yellow-600 hover:from-yellow-200 hover:to-yellow-500 text-yellow-950 w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl border border-yellow-200/50 disabled:opacity-30 relative z-10"
                >
                  <Play fill="currentColor" size={24} /> 
                  <span className="tracking-tighter italic">DEAL HAND</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center gap-2 sm:gap-4 flex-wrap max-w-3xl mx-auto w-full">
            {gameState === 'player_turn' ? (
              <>
                <button 
                  onClick={hit}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white flex-1 sm:flex-none justify-center px-6 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 text-sm shadow-xl backdrop-blur-md min-w-[100px]"
                >
                  <Hand size={18} /> HIT
                </button>
                <button 
                  onClick={stand}
                  className="bg-rose-600/80 hover:bg-rose-500 border border-rose-400/50 text-white flex-1 sm:flex-none justify-center px-6 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 text-sm shadow-xl min-w-[100px]"
                >
                  <Bot size={18} /> STAND
                </button>
                {playerHand.length === 2 && bankroll >= roundBet && (
                  <button 
                    onClick={doubleDown}
                    className="bg-yellow-500/80 hover:bg-yellow-400 border border-yellow-300/50 text-yellow-950 flex-1 sm:flex-none justify-center px-6 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 text-sm shadow-xl min-w-[100px]"
                  >
                    <ArrowUpCircle size={18} /> DOUBLE
                  </button>
                )}
                {playerHand.length === 2 && (
                  <button 
                    onClick={surrender}
                    className="bg-slate-700/80 hover:bg-slate-600 border border-slate-400/50 text-white flex-1 sm:flex-none justify-center px-6 py-3.5 rounded-xl font-black flex items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 text-sm shadow-xl min-w-[100px]"
                  >
                    <AlertCircle size={18} /> SURRENDER
                  </button>
                )}
              </>
            ) : (
              gameState === 'result' && (
                <button 
                  onClick={() => {
                    setGameState('betting');
                    setPlayerHand([]);
                    setDealerHand([]);
                    setMessage('Place your bet!');
                  }}
                  className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 border border-white/20 text-white w-full sm:w-auto px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 text-lg shadow-2xl italic"
                >
                  <RotateCcw size={20} className="animate-spin-slow" /> PLAY AGAIN
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
