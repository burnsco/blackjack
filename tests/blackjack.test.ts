/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import {
  calculateHandValue,
  createDeck,
  dealInitialHands,
  dealerShouldHit,
  determineOutcome,
  isBlackjack,
  isBust,
  isSoft,
  payoutForOutcome,
  rankValue,
  shuffleDeck,
  type Card,
  type Rank,
  type Suit,
} from "../src/lib/blackjack";

const card = (rank: Rank, suit: Suit = "spades"): Card => ({
  rank,
  suit,
  value: rankValue(rank),
});

describe("createDeck", () => {
  const deck = createDeck();

  test("contains 52 cards", () => {
    expect(deck).toHaveLength(52);
  });

  test("contains 13 cards per suit", () => {
    for (const suit of ["hearts", "diamonds", "clubs", "spades"] as Suit[]) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });

  test("contains 4 cards per rank", () => {
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    for (const rank of ranks) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(4);
    }
  });

  test("assigns 10 to face cards and 11 to aces", () => {
    expect(deck.find((c) => c.rank === "K")!.value).toBe(10);
    expect(deck.find((c) => c.rank === "Q")!.value).toBe(10);
    expect(deck.find((c) => c.rank === "J")!.value).toBe(10);
    expect(deck.find((c) => c.rank === "A")!.value).toBe(11);
    expect(deck.find((c) => c.rank === "2")!.value).toBe(2);
    expect(deck.find((c) => c.rank === "10")!.value).toBe(10);
  });

  test("contains no duplicate suit/rank pairs", () => {
    const seen = new Set(deck.map((c) => `${c.rank}-${c.suit}`));
    expect(seen.size).toBe(52);
  });
});

describe("shuffleDeck", () => {
  test("returns a deck with the same cards", () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original);
    expect(shuffled).toHaveLength(original.length);
    const key = (c: Card) => `${c.rank}-${c.suit}`;
    expect(shuffled.map(key).toSorted()).toEqual(original.map(key).toSorted());
  });

  test("does not mutate the input deck", () => {
    const original = createDeck();
    const snapshot = original.map((c) => `${c.rank}-${c.suit}`);
    shuffleDeck(original);
    expect(original.map((c) => `${c.rank}-${c.suit}`)).toEqual(snapshot);
  });

  test("changes the order at least once across many shuffles", () => {
    const original = createDeck();
    const sameOrder = (a: Card[], b: Card[]) =>
      a.every((c, i) => c.rank === b[i].rank && c.suit === b[i].suit);
    let differs = false;
    for (let i = 0; i < 5; i++) {
      if (!sameOrder(shuffleDeck(original), original)) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

describe("calculateHandValue", () => {
  test("sums simple number cards", () => {
    expect(calculateHandValue([card("5"), card("7")])).toBe(12);
  });

  test("treats face cards as 10", () => {
    expect(calculateHandValue([card("K"), card("Q")])).toBe(20);
    expect(calculateHandValue([card("J"), card("10")])).toBe(20);
  });

  test("treats a single ace as 11 when safe", () => {
    expect(calculateHandValue([card("A"), card("9")])).toBe(20);
  });

  test("downgrades ace to 1 to avoid bust", () => {
    expect(calculateHandValue([card("A"), card("9"), card("5")])).toBe(15);
  });

  test("handles two aces as 1 + 11 (= 12)", () => {
    expect(calculateHandValue([card("A"), card("A")])).toBe(12);
  });

  test("handles three aces as 1 + 1 + 11 (= 13)", () => {
    expect(calculateHandValue([card("A"), card("A"), card("A")])).toBe(13);
  });

  test("handles four aces as 1 + 1 + 1 + 11 (= 14)", () => {
    expect(calculateHandValue([card("A"), card("A"), card("A"), card("A")])).toBe(14);
  });

  test("downgrades multiple aces independently when needed", () => {
    expect(calculateHandValue([card("A"), card("A"), card("9")])).toBe(21);
    expect(calculateHandValue([card("A"), card("A"), card("9"), card("5")])).toBe(16);
  });

  test("returns 0 for an empty hand", () => {
    expect(calculateHandValue([])).toBe(0);
  });

  test("returns the bust value when no aces can rescue", () => {
    expect(calculateHandValue([card("K"), card("Q"), card("5")])).toBe(25);
  });
});

describe("isSoft", () => {
  test("A+6 is soft 17", () => {
    expect(isSoft([card("A"), card("6")])).toBe(true);
  });

  test("A+9 is soft 20", () => {
    expect(isSoft([card("A"), card("9")])).toBe(true);
  });

  test("hand without an ace is not soft", () => {
    expect(isSoft([card("10"), card("7")])).toBe(false);
  });

  test("ace counted as 1 (forced) is not soft", () => {
    expect(isSoft([card("A"), card("9"), card("5")])).toBe(false);
  });
});

describe("isBlackjack", () => {
  test("two-card 21 is blackjack", () => {
    expect(isBlackjack([card("A"), card("K")])).toBe(true);
    expect(isBlackjack([card("A"), card("10")])).toBe(true);
  });

  test("three-card 21 is NOT blackjack", () => {
    expect(isBlackjack([card("7"), card("7"), card("7")])).toBe(false);
    expect(isBlackjack([card("A"), card("5"), card("5")])).toBe(false);
  });

  test("non-21 two-card hand is not blackjack", () => {
    expect(isBlackjack([card("10"), card("9")])).toBe(false);
  });
});

describe("isBust", () => {
  test("over 21 is bust", () => {
    expect(isBust([card("K"), card("Q"), card("5")])).toBe(true);
  });

  test("exactly 21 is not bust", () => {
    expect(isBust([card("A"), card("K")])).toBe(false);
    expect(isBust([card("7"), card("7"), card("7")])).toBe(false);
  });

  test("aces save the hand from busting", () => {
    expect(isBust([card("A"), card("9"), card("5")])).toBe(false);
  });
});

describe("dealerShouldHit (S17 policy)", () => {
  test("hits below 17", () => {
    expect(dealerShouldHit([card("10"), card("6")])).toBe(true);
    expect(dealerShouldHit([card("5"), card("2")])).toBe(true);
  });

  test("stands on hard 17", () => {
    expect(dealerShouldHit([card("10"), card("7")])).toBe(false);
  });

  test("stands on soft 17 (A+6) — S17 policy", () => {
    expect(dealerShouldHit([card("A"), card("6")])).toBe(false);
  });

  test("stands on 21", () => {
    expect(dealerShouldHit([card("A"), card("K")])).toBe(false);
  });

  test("does not hit when busted", () => {
    expect(dealerShouldHit([card("K"), card("Q"), card("5")])).toBe(false);
  });
});

describe("determineOutcome", () => {
  test("both blackjack -> push", () => {
    expect(determineOutcome([card("A"), card("K")], [card("A"), card("Q")])).toBe("push");
  });

  test("player blackjack vs non-blackjack -> player_blackjack", () => {
    expect(determineOutcome([card("A"), card("K")], [card("10"), card("9")])).toBe(
      "player_blackjack",
    );
  });

  test("dealer blackjack vs non-blackjack -> dealer_blackjack", () => {
    expect(determineOutcome([card("10"), card("9")], [card("A"), card("Q")])).toBe(
      "dealer_blackjack",
    );
  });

  test("a 3-card 21 vs dealer blackjack still loses to dealer blackjack", () => {
    expect(determineOutcome([card("7"), card("7"), card("7")], [card("A"), card("K")])).toBe(
      "dealer_blackjack",
    );
  });

  test("player bust loses even if dealer would have busted later", () => {
    expect(
      determineOutcome([card("K"), card("Q"), card("5")], [card("K"), card("Q"), card("5")]),
    ).toBe("player_bust");
  });

  test("dealer bust -> dealer_bust", () => {
    expect(determineOutcome([card("10"), card("8")], [card("K"), card("Q"), card("5")])).toBe(
      "dealer_bust",
    );
  });

  test("higher player total wins", () => {
    expect(determineOutcome([card("10"), card("9")], [card("10"), card("8")])).toBe("player_win");
  });

  test("higher dealer total wins", () => {
    expect(determineOutcome([card("10"), card("7")], [card("10"), card("9")])).toBe("dealer_win");
  });

  test("equal totals push", () => {
    expect(determineOutcome([card("10"), card("8")], [card("10"), card("8")])).toBe("push");
  });

  test("3-card 21 ties dealer 21 -> push (not blackjack)", () => {
    expect(
      determineOutcome([card("7"), card("7"), card("7")], [card("10"), card("5"), card("6")]),
    ).toBe("push");
  });
});

describe("payoutForOutcome", () => {
  test("blackjack pays 2.5x bet (3:2 + bet returned)", () => {
    expect(payoutForOutcome("player_blackjack", 10)).toBe(25);
    expect(payoutForOutcome("player_blackjack", 100)).toBe(250);
  });

  test("regular win pays 2x bet (1:1 + bet returned)", () => {
    expect(payoutForOutcome("player_win", 50)).toBe(100);
    expect(payoutForOutcome("dealer_bust", 50)).toBe(100);
  });

  test("push returns the bet", () => {
    expect(payoutForOutcome("push", 75)).toBe(75);
  });

  test("losses return nothing", () => {
    expect(payoutForOutcome("player_bust", 10)).toBe(0);
    expect(payoutForOutcome("dealer_win", 10)).toBe(0);
    expect(payoutForOutcome("dealer_blackjack", 10)).toBe(0);
  });

  test("net bankroll change matches expected (bet was already deducted)", () => {
    // Net = payout - bet
    expect(payoutForOutcome("player_blackjack", 10) - 10).toBe(15);
    expect(payoutForOutcome("player_win", 10) - 10).toBe(10);
    expect(payoutForOutcome("push", 10) - 10).toBe(0);
    expect(payoutForOutcome("dealer_win", 10) - 10).toBe(-10);
  });
});

describe("dealInitialHands", () => {
  test("deals 2 cards to player and 2 to dealer", () => {
    const deck = createDeck();
    const { playerHand, dealerHand, remainingDeck } = dealInitialHands(deck);
    expect(playerHand).toHaveLength(2);
    expect(dealerHand).toHaveLength(2);
    expect(remainingDeck).toHaveLength(deck.length - 4);
  });

  test("deals in alternating order: P, D, P, D from the top of the deck (deck.pop)", () => {
    // Build a deck where pop() yields known sequence: pop returns last element.
    // Set up so order from top is: A♠, K♠, Q♠, J♠
    const deck: Card[] = [card("J"), card("Q"), card("K"), card("A")];
    const { playerHand, dealerHand, remainingDeck } = dealInitialHands(deck);
    expect(playerHand[0].rank).toBe("A"); // first to player
    expect(dealerHand[0].rank).toBe("K"); // then dealer
    expect(playerHand[1].rank).toBe("Q"); // then player
    expect(dealerHand[1].rank).toBe("J"); // then dealer
    expect(remainingDeck).toHaveLength(0);
  });

  test("does not mutate the original deck", () => {
    const deck = createDeck();
    const before = deck.length;
    dealInitialHands(deck);
    expect(deck).toHaveLength(before);
  });

  test("throws if deck has fewer than 4 cards", () => {
    expect(() => dealInitialHands([card("A"), card("K"), card("Q")])).toThrow();
  });
});

describe("end-to-end scenarios", () => {
  test("player blackjack on initial deal pays 3:2", () => {
    const player = [card("A"), card("K")];
    const dealer = [card("9"), card("7")];
    const outcome = determineOutcome(player, dealer);
    expect(outcome).toBe("player_blackjack");
    expect(payoutForOutcome(outcome, 100)).toBe(250);
  });

  test("dealer hits to 17 then stands and beats player 16", () => {
    let dealer = [card("10"), card("6")];
    expect(dealerShouldHit(dealer)).toBe(true);
    dealer = [...dealer, card("A")]; // 10 + 6 + A(=1) = 17
    expect(calculateHandValue(dealer)).toBe(17);
    expect(dealerShouldHit(dealer)).toBe(false);
    expect(determineOutcome([card("10"), card("6")], dealer)).toBe("dealer_win");
  });

  test("dealer draws past 21 -> dealer_bust pays 2x", () => {
    const player = [card("10"), card("8")];
    const dealer = [card("10"), card("6"), card("K")]; // 26
    expect(isBust(dealer)).toBe(true);
    const outcome = determineOutcome(player, dealer);
    expect(outcome).toBe("dealer_bust");
    expect(payoutForOutcome(outcome, 25)).toBe(50);
  });

  test("player busts after hitting -> loses bet regardless of dealer", () => {
    const player = [card("10"), card("6"), card("K")]; // 26
    const dealer = [card("10"), card("6")]; // dealer hasn't played yet
    expect(determineOutcome(player, dealer)).toBe("player_bust");
    expect(payoutForOutcome("player_bust", 50)).toBe(0);
  });

  test("double-down win doubles the effective payout", () => {
    const bet = 10;
    const doubledBet = bet * 2;
    const player = [card("5"), card("6"), card("K")]; // 21
    const dealer = [card("10"), card("8")]; // 18
    const outcome = determineOutcome(player, dealer);
    expect(outcome).toBe("player_win");
    expect(payoutForOutcome(outcome, doubledBet)).toBe(40);
  });
});
