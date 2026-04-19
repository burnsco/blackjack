export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function rankValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return parseInt(rank);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: rankValue(rank) });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function calculateHandValue(hand: Card[]): number {
  let value = hand.reduce((acc, card) => acc + card.value, 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}

export function isSoft(hand: Card[]): boolean {
  const raw = hand.reduce((acc, card) => acc + card.value, 0);
  const aces = hand.filter((card) => card.rank === "A").length;
  if (aces === 0) return false;
  return calculateHandValue(hand) <= 21 && raw - calculateHandValue(hand) < aces * 10;
}

export function isBust(hand: Card[]): boolean {
  return calculateHandValue(hand) > 21;
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

// Dealer policy: stand on all 17s (S17).
export function dealerShouldHit(hand: Card[]): boolean {
  return calculateHandValue(hand) < 17;
}

export type Outcome =
  | "player_blackjack"
  | "dealer_blackjack"
  | "push"
  | "player_bust"
  | "dealer_bust"
  | "player_win"
  | "dealer_win";

export function determineOutcome(playerHand: Card[], dealerHand: Card[]): Outcome {
  const pBJ = isBlackjack(playerHand);
  const dBJ = isBlackjack(dealerHand);

  if (pBJ && dBJ) return "push";
  if (pBJ) return "player_blackjack";
  if (dBJ) return "dealer_blackjack";

  if (isBust(playerHand)) return "player_bust";
  if (isBust(dealerHand)) return "dealer_bust";

  const pVal = calculateHandValue(playerHand);
  const dVal = calculateHandValue(dealerHand);
  if (pVal > dVal) return "player_win";
  if (pVal < dVal) return "dealer_win";
  return "push";
}

// Returns the amount credited back to the bankroll for a given outcome,
// assuming the bet has already been deducted at the start of the round.
//   - player_blackjack: 2.5x bet (3:2 payout includes returning the bet)
//   - player_win / dealer_bust: 2x bet (1:1 payout includes returning the bet)
//   - push: 1x bet (return original wager)
//   - player_bust / dealer_win / dealer_blackjack: 0 (bet is forfeit)
export function payoutForOutcome(outcome: Outcome, bet: number): number {
  switch (outcome) {
    case "player_blackjack":
      return bet * 2.5;
    case "player_win":
    case "dealer_bust":
      return bet * 2;
    case "push":
      return bet;
    case "player_bust":
    case "dealer_win":
    case "dealer_blackjack":
      return 0;
  }
}

export interface InitialDeal {
  playerHand: Card[];
  dealerHand: Card[];
  remainingDeck: Card[];
}

// Deals two cards to each in standard alternating order: player, dealer, player, dealer.
// Cards come from the END of the deck (deck.pop()) to match a typical "top of deck" model.
export function dealInitialHands(deck: Card[]): InitialDeal {
  if (deck.length < 4) {
    throw new Error("Not enough cards to deal initial hands");
  }
  const remainingDeck = [...deck];
  const p1 = remainingDeck.pop()!;
  const d1 = remainingDeck.pop()!;
  const p2 = remainingDeck.pop()!;
  const d2 = remainingDeck.pop()!;
  return {
    playerHand: [p1, p2],
    dealerHand: [d1, d2],
    remainingDeck,
  };
}
