export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const allRanks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of allRanks) {
      let value = 0;
      if (["J", "Q", "K"].includes(rank)) {
        value = 10;
      } else if (rank === "A") {
        value = 11;
      } else {
        value = parseInt(rank);
      }
      deck.push({ suit, rank, value });
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
