# CampusExchange - Backend

NestJS 11 REST API for the CampusExchange marketplace.

## Modules
- **Auth** - Register, login (JWT), profile
- **Users** - Profile view/update
- **Listings** - CRUD with search, filter, pagination
- **Bids** - Bidding system for listings
- **Messages** - Conversations and private messaging
- **Reviews** - Post-transaction ratings
- **Reports** - Flagging system with auto-hide

## API Prefix
All endpoints use `/api` prefix (e.g., `/api/auth/login`, `/api/listings`)

## Running
This service runs via Docker Compose from the project root. See the main [README](../README.md) for setup instructions.
