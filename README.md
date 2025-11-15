# ThenBetThat - Prediction Markets Application

A full-featured prediction markets platform where users can create communities, trade on prediction markets, and engage with others through chat and a social feed.

## Features

### Communities
- **Public & Private Communities**: Create public communities anyone can join, or private communities with invite codes
- **Admin Management**: Community creators are automatically admins and can manage the community
- **Community Chat**: Real-time chat functionality for community members

### Prediction Markets
- **Multi-Outcome Markets**: Create markets with multiple possible outcomes
- **YES/NO Trading**: Trade on whether outcomes will happen or not
- **Market & Limit Orders**: Execute trades immediately or wait for your desired price
- **Order Matching Engine**: Sophisticated matching where YES at probability p matches NO at probability (1-p)
- **Market Resolution**: Market creators can resolve outcomes and close trading

### Trading
- **Buy & Sell**: Buy YES or NO positions, sell to cash out
- **Real-time Probabilities**: Market prices update based on trades
- **Portfolio Tracking**: View all your positions and profit/loss
- **Order Book**: See all open orders for each outcome

### Social Features
- **Feed**: Discover trending markets based on upvotes
- **Upvoting**: Upvote markets to surface the most interesting predictions
- **User Profiles**: Track your trading history and positions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Real-time**: Polling-based chat (can be upgraded to WebSockets)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ThenBetThat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/thenbetthat?schema=public"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main models:

- **User**: User accounts with authentication
- **Community**: Public/private communities with invite codes
- **CommunityMember**: Junction table for community membership with roles
- **Market**: Prediction markets within communities
- **Outcome**: Possible outcomes for each market
- **Order**: Buy/sell orders (YES/NO, Market/Limit)
- **Position**: User positions in outcomes
- **Trade**: Completed trades between orders
- **Message**: Community chat messages
- **Upvote**: Market upvotes for the feed

## How Trading Works

1. **Creating Orders**: Users can place YES or NO orders on outcomes
2. **Order Matching**:
   - YES orders at probability p match with NO orders at probability (1-p)
   - Orders are matched FIFO (first in, first out)
   - Partial fills are supported
3. **Positions**: When orders match, user positions are created/updated
4. **Market Prices**: Outcome probabilities update based on recent trades
5. **Resolution**: Market creators resolve outcomes to YES or NO

## Project Structure

```
ThenBetThat/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main application pages
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/
│   ├── communities/         # Community components
│   ├── markets/            # Market and trading components
│   ├── providers/          # React context providers
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── matching-engine.ts  # Order matching logic
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma       # Database schema
└── types/                  # TypeScript type definitions
```

## Key Features Implementation

### Community Management
- Create public/private communities
- Generate unique invite codes for private communities
- Join communities with invite codes
- Admin role management

### Market Creation
- Create markets with multiple outcomes
- Set descriptions and closing times
- Equal initial probabilities for all outcomes

### Order Matching Engine
- Sophisticated matching algorithm
- YES at p matches NO at (1-p)
- Support for market and limit orders
- Automatic position tracking
- Real-time probability updates

### Chat System
- Community-based chat rooms
- Real-time message polling
- User attribution for messages

### Feed & Discovery
- Aggregate markets from all user communities
- Sort by upvotes
- Real-time upvote toggling

## Future Enhancements

- WebSocket-based real-time updates
- Advanced charting and analytics
- Mobile responsive improvements
- User profiles and statistics
- Market categories and tags
- Email notifications
- API documentation
- Admin dashboard
- Market liquidity pools
- Automated market makers (AMM)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.