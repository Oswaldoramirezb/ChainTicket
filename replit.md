# TicketChain - Movement M1 Hackathon

## Overview
TicketChain is a tokenized ticketing platform built on Movement blockchain for the M1 Hackathon. It allows businesses to create, sell, and manage tokenized tickets (NFTs) for events, capacity limits, or special offers.

## Project Structure

```
/
├── client/          # Next.js 14 frontend
│   ├── src/
│   │   └── app/     # App Router pages and components
│   └── package.json
├── backend/         # Express.js API server
│   ├── server.js
│   └── package.json
├── contracts/       # Movement Move smart contracts
│   ├── sources/
│   │   └── ticket.move
│   └── Move.toml
└── replit.md        # This file
```

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **TypeScript**
- Planned: Privy for wallet auth, x402 for payments

### Backend
- **Express.js** API
- Planned: AI integration (AWS Bedrock or OpenAI) for recommendations

### Blockchain
- **Movement blockchain** (Move language)
- Smart contracts for ticket NFT creation, purchase, and validation

## Running the Project

The frontend runs on port 5000, backend on port 3001.

## Key Features (MVP)

1. **Ticket Creation** - Businesses create tokenized event tickets
2. **AI Recommendations** - Get suggestions on ticket quantities
3. **QR Validation** - Scan tickets at entry points
4. **Analytics Dashboard** - Track sales and revenue

## Integrations Planned

- **Privy** - Wallet authentication
- **x402** - Crypto payment processing
- **AWS Bedrock/OpenAI** - AI assistant for business queries

## Hackathon Timeline
Movement M1 Hackathon ends late December 2024.
