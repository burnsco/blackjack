import React, { useState, useEffect, useCallback } from 'react';
import { createDeck, shuffleDeck, calculateHandValue, type Card, type Suit, type Rank } from '../lib/blackjack';
import { Coins, RotateCcw, Play, Hand, User, Bot, AlertCircle, ArrowUpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'betting' | 'player_turn' | 'dealer_turn' | 'result';

const CardUI = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => {
  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const getSuitColor = (suit: Suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-slate-800';
  };

  if (hidden) {
    return (
      <div className="w-24 h-36 bg-blue-800 border-4 border-white rounded-lg shadow-lg flex items-center justify-center">
        <div className="w-16 h-28 border-2 border-white/20 rounded flex items-center justify-center">
          <div className="text-white/20 text-4xl">?</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-24 h-36 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-col justify-between ${getSuitColor(card.suit)}`}>
      <div className="font-bold text-xl leading-none">{card.rank}</div>
      <div className="self-center text-4xl">{getSuitSymbol(card.suit)}</div>
      <div className="font-bold text-xl self-end rotate-180 leading-none">{card.rank}</div>
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

  // Initialize deck
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

  // Dealer logic
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
        }, 1000);
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
    <div className="max-w-4xl mx-auto p-8 bg-emerald-900 rounded-2xl shadow-2xl min-h-[600px] text-white font-sans flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-emerald-800 pb-4">
        <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
          <Coins className="text-yellow-400" /> BLACKJACK
        </h1>
        <div className="bg-black/30 px-4 py-2 rounded-full flex items-center gap-4">
          <span className="text-emerald-300 font-bold uppercase text-xs">Bankroll</span>
          <span className="text-xl font-mono text-yellow-400">${bankroll}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col justify-center gap-12 relative">
        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Bot size={20} />
            <span className="uppercase text-sm font-bold tracking-widest">Dealer</span>
            {gameState !== 'betting' && (
              <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-mono">
                {gameState === 'player_turn' && dealerHand.length > 0 ? '?' : calculateHandValue(dealerHand)}
              </span>
            )}
          </div>
          <div className="flex gap-2 min-h-[144px]">
            {dealerHand.map((card, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-top-4 duration-500">
                <CardUI card={card} hidden={gameState === 'player_turn' && i === 1} />
              </div>
            ))}
            {dealerHand.length === 0 && <div className="w-24 h-36 border-2 border-dashed border-emerald-800/50 rounded-lg" />}
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <div className="inline-block bg-black/40 px-6 py-2 rounded-full text-lg font-medium animate-pulse border border-white/10">
            {message}
          </div>
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 min-h-[144px]">
            {playerHand.map((card, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                <CardUI card={card} />
              </div>
            ))}
            {playerHand.length === 0 && <div className="w-24 h-36 border-2 border-dashed border-emerald-800/50 rounded-lg" />}
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <User size={20} />
            <span className="uppercase text-sm font-bold tracking-widest">Player</span>
            {playerHand.length > 0 && (
              <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-mono">
                {calculateHandValue(playerHand)}
              </span>
            )}
            {gameState !== 'betting' && roundBet > 0 && (
              <span className="ml-4 text-yellow-400 font-mono text-sm">
                Wager: ${roundBet}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/40 p-6 rounded-xl border border-white/5 shadow-inner">
        {gameState === 'betting' ? (
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between w-full">
            {bankroll < 10 && currentBet > bankroll ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <p className="text-yellow-400 font-bold">You're out of chips!</p>
                <button 
                  onClick={() => {
                    setBankroll(1000);
                    setCurrentBet(10);
                    setMessage('Bankroll recharged! Place your bet.');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Coins size={20} /> RECHARGE $1000
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  {[10, 50, 100, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCurrentBet(amt)}
                      disabled={bankroll < amt}
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 ${
                        currentBet === amt 
                          ? 'bg-yellow-500 border-white text-black scale-110' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={startNewRound}
                  disabled={bankroll < currentBet}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-4 rounded-full font-black text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Play fill="black" /> DEAL HAND
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center gap-4 flex-wrap">
            {gameState === 'player_turn' ? (
              <>
                <button 
                  onClick={hit}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:translate-y-[-2px]"
                >
                  <Hand size={20} /> HIT
                </button>
                <button 
                  onClick={stand}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:translate-y-[-2px]"
                >
                  <Bot size={20} /> STAND
                </button>
                {playerHand.length === 2 && bankroll >= roundBet && (
                  <button 
                    onClick={doubleDown}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:translate-y-[-2px]"
                  >
                    <ArrowUpCircle size={20} /> DOUBLE DOWN
                  </button>
                )}
                {playerHand.length === 2 && (
                  <button 
                    onClick={surrender}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:translate-y-[-2px]"
                  >
                    <AlertCircle size={20} /> SURRENDER
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105"
                >
                  <RotateCcw size={20} /> PLAY AGAIN
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
