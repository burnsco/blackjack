# 🃏 Classic Blackjack

A modern, fast, and visually appealing Blackjack game built with **Astro**, **React**, and **Tailwind CSS**.

## ✨ Features

- **Casino Grade Logic**: Accurately handles hits, stands, and surrenders.
- **Natural Blackjack**: Automatic 3:2 payout for a natural 21 on the deal.
- **Responsive UI**: Dark casino-themed interface that works on all screen sizes.
- **Smooth Animations**: Animated card deals and UI transitions.
- **Victory Effects**: Celebration effects for big wins using `canvas-confetti`.
- **Bankroll System**: Track your earnings and recharge your chips if you go broke.

## 🚀 Tech Stack

- [Astro](https://astro.build/) - Web framework for speed.
- [React](https://reactjs.org/) - For robust state-driven game logic.
- [Tailwind CSS](https://tailwindcss.com/) - For a sleek, modern aesthetic.
- [Lucide React](https://lucide.dev/) - For beautiful, consistent iconography.

## 🛠️ Development

### Prerequisites

- Node.js (v18+)
- npm / pnpm / bun

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Rules

- **Goal**: Get a hand total closer to 21 than the dealer without going over.
- **Dealer Rules**: Dealer must hit until they have at least 17.
- **Payouts**:
  - Standard Win: 1:1
  - Blackjack: 3:2
  - Push: Bet returned
  - Surrender (Fold): Half bet returned
