# Chain Ticket - Movement M1 Hackathon

## Overview
Chain Ticket is a tokenized ticketing platform built on the Movement blockchain. It enables businesses to create, sell, and manage tokenized tickets (NFTs) for various purposes like events, capacity limits, or special offers. The platform supports diverse vendor types, from social events and restaurants to supermarkets and spas, each with tailored ticketing strategies. The project aims to provide a robust and flexible solution for modern ticketing and access control.

## User Preferences
I prefer simple language and clear, direct instructions. I want iterative development, with small, testable changes. Please ask before making any major architectural changes or introducing new dependencies. Do not make changes to the `replit.md` file itself.

## System Architecture

### UI/UX Decisions
The frontend is built with React and Vite, utilizing Tailwind CSS for styling to ensure a modern and responsive design. Framer Motion is integrated for smooth animations, enhancing the user experience. The application features distinct navigation for clients (bottom nav) and admins (sidebar + bottom nav), focusing on intuitive access to features.

### Technical Implementations
- **Frontend**: React 18.2.0 with Vite, Tailwind CSS, Framer Motion, React Router. Privy 1.88.4 is used for robust wallet authentication, supporting email, wallet, and social logins.
- **Backend**: Express.js API server, PostgreSQL for user persistence, and OpenAI integration for AI-driven recommendations.
- **Blockchain**: Movement blockchain using Move language for smart contracts.

### Feature Specifications
- **Tokenized Ticket Creation**: Businesses can create NFT tickets for events or services.
- **AI Recommendations**: Suggestions for ticket quantities and business insights powered by OpenAI.
- **QR Validation**: Secure scanning and validation of tickets at entry points.
- **Analytics Dashboard**: Comprehensive tracking of sales and revenue for businesses.
- **Authentication**: Privy handles user authentication, supporting both client and vendor roles.
- **Guest Mode**: Users can browse anonymously for 24 hours, with data preservation upon registration.
- **User Profiles**: Editable profiles for both clients and vendors, storing personal and business details.
- **Vendor Types & Strategies**: Support for various vendor types (e.g., events, restaurant, supermarket) with specific ticketing strategies (e.g., `per_service`, `queue_only`, `per_order`).
- **Services/Tickets Management**: Admins can add, edit, activate/deactivate, and delete services/tickets, managing details like title, image, duration, stock, and schedule.

### System Design Choices
- **Client-Server Architecture**: A clear separation between the React frontend and Express.js backend.
- **Smart Contract Architecture**:
    - **AdminRegistry**: Manages administrator roles and permissions, including superadmin functionalities and self-service options for adding admins.
    - **Ticket**: Core contract for event and ticket NFTs, handling creation, minting, transfer, usage, burning, and event cancellation. It supports both permanent and non-permanent ticket lifecycles.
    - **BusinessProfile**: Stores business-specific metadata for AI recommendations, including capacity, peak hours, event metrics, and associated admin registries.
- **Payment Flow**: Off-chain payment processing (via backend) followed by on-chain ticket minting, ensuring flexibility and efficiency.
- **QR Code System**: Secure QR code generation and validation for ticket check-ins, leveraging hashes for integrity.

## External Dependencies
- **Privy (1.88.4)**: Wallet authentication for email, wallet, and social logins.
- **PostgreSQL**: Database for persisting user and business data.
- **Movement Blockchain**: The underlying blockchain for smart contract deployment and tokenized ticketing.
- **OpenAI**: Integrated for AI recommendations, such as ticket quantity suggestions.
- **Unsplash**: Used for demo image assets.