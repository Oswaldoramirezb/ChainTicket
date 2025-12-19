# Chain Ticket - Movement M1 Hackathon

## Overview
Chain Ticket is a tokenized ticketing platform built on Movement blockchain for the M1 Hackathon. It allows businesses to create, sell, and manage tokenized tickets (NFTs) for events, capacity limits, or special offers.

## Project Structure

```
/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React contexts (AuthContext, DataContext)
│   │   ├── pages/       # Page components
│   │   │   ├── admin/   # Admin pages (Dashboard, Services, Profile)
│   │   │   ├── client/  # Client pages (VendorSelection, Menu, Cart, Orders, Profile)
│   │   │   ├── Login.jsx
│   │   │   └── Registration.jsx
│   │   └── assets/      # Images and static assets
│   ├── vite.config.js
│   └── package.json
├── backend/             # Express.js API server
│   ├── server.js
│   └── package.json
├── contracts/           # Movement Move smart contracts
│   ├── sources/
│   │   └── ticket.move
│   └── Move.toml
└── replit.md            # This file
```

## Tech Stack

### Frontend
- **React 18.2.0** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Privy 1.88.4** for wallet authentication (email, wallet, social login)
- **React Router** for navigation

### Backend
- **Express.js** API
- OpenAI integration for AI recommendations

### Blockchain
- **Movement blockchain** (Move language)
- Smart contracts for ticket NFT creation, purchase, and validation

## Smart Contracts Architecture

### 1. AdminRegistry (admin_registry.move)
Manages administrator roles for the platform.

**Functions:**
- `initialize(superadmin)` - Creates the registry with initial superadmin
- `add_admin(caller, registry_address, new_admin)` - Superadmin adds new admins
- `remove_admin(caller, registry_address, admin_to_remove)` - Superadmin removes admins

**View Functions:**
- `is_admin(registry_address, addr)` - Check if address is admin
- `is_superadmin(registry_address, addr)` - Check if address is superadmin
- `get_all_admins(registry_address)` - Get list of all admins

### 2. Ticket (ticket.move)
Main contract for events and ticket NFTs.

**Event Struct Fields:**
- `name`, `description`, `business_address`
- `total_tickets`, `tickets_sold`, `ticket_price`
- `is_active` - Event status
- `transferable` - Can tickets be transferred between users
- `resalable` - Can tickets be resold
- `permanent` - Tickets can be reused (vs single-use)
- `refundable` - Can tickets be refunded

**Ticket Struct Fields:**
- `event_id`, `ticket_number`, `owner`
- `is_used` - Has the ticket been consumed
- `permanent` - Copied from event config
- `qr_hash` - Hash for QR code validation

**Entry Functions:**
- `create_event(...)` - Business creates event with all configurations
- `purchase_ticket(buyer, event_object, qr_hash)` - Mint ticket on purchase
- `transfer_ticket(sender, ticket_object, recipient)` - Transfer if allowed
- `use_ticket(user, ticket_object)` - Mark ticket as used
- `validate_ticket(validator, ticket_object, event_object)` - Business validates entry
- `cancel_event(business, event_object)` - Cancel event
- `reset_permanent_ticket(owner, ticket_object)` - Reset permanent ticket for reuse

**View Functions:**
- `get_event_info(event_object)` - All event details
- `get_ticket_info(ticket_object)` - All ticket details
- `is_ticket_valid(ticket_object)` - Check if ticket can be used
- `get_event_business(event_object)` - Get event owner
- `is_event_active(event_object)` - Check event status
- `verify_qr_hash(ticket_object, hash)` - Validate QR hash

**Events (Logs):**
- EventCreated, TicketPurchased, TicketValidated
- TicketTransferred, TicketUsed, EventCancelled

## Running the Project

The frontend runs on port 5000, backend on port 3001.

## Key Features (MVP)

1. **Ticket Creation** - Businesses create tokenized event tickets
2. **AI Recommendations** - Get suggestions on ticket quantities
3. **QR Validation** - Scan tickets at entry points
4. **Analytics Dashboard** - Track sales and revenue

## Vendor Categories

- **Bar** - Golden Bar & Lounge
- **Restaurant** - Premium Steakhouse
- **Coffee** - Artisan Coffee Co.
- **Social Event** - Elite Events (VIP Gala, Networking Parties, Concerts, Art Exhibitions)

## Services/Tickets Management (Admin)

Each service/ticket includes:
- **Title** - Name of the service/event
- **Image** - Visual representation
- **Duration** - How long the service/event lasts
- **Total Tickets** - Maximum capacity
- **Sold Count** - Tickets already sold
- **isActive** - Enable/disable the service
- **Schedule** - Operating hours and days

Admin Controls:
- **Add Service** - Create new tickets/services with schedule
- **Edit** - Modify title, duration, stock, schedule, and operating days
- **Activate/Deactivate** - Toggle service availability (green power button)
- **Delete** - Remove service with confirmation dialog

## Authentication & Registration

- **Privy** integration for wallet/social authentication
- Traditional username/password login also available
- Test credentials: admin/123 or user/123
- **New wallet registration flow**: When a new wallet connects, users select whether to register as User or Vendor, then fill out profile information

## User Profiles

- Both clients and admins have "My Profile" pages
- Users can edit: Full Name, Email, Phone, Location
- Vendors can also set: Business Name
- Profile data is stored in localStorage and persists across sessions

## Navigation

### Client Navigation (Bottom Nav Mobile)
- Catalog - Browse establishments
- Wallet - View orders/tickets
- Profile - Manage account

### Admin Navigation (Sidebar + Bottom Nav Mobile)
- Overview - Manage orders/queue
- Services - Manage tickets/services with schedules
- My Profile - Account settings

## Important Notes

- Privy version must stay at 1.88.4 to avoid React hook conflicts
- React must stay at 18.2.0 for compatibility with Privy
- Vite config includes aliases to prevent duplicate React instances
- Hook errors in console are related to Privy's iframe integration in Replit environment

## Privy App ID
clpispdty00ycl80fpueukbhl
