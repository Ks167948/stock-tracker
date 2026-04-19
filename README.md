# Stock Alert & Portfolio Tracker API

A production-grade REST API for tracking stock portfolios and price alerts — built with Node.js, Express, MongoDB, Redis, and BullMQ. Deployed live on Railway.

**Live API:** `https://stock-tracker-production-ed21.up.railway.app`

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Engineering Decisions](#key-engineering-decisions)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)

---

## Overview

This project simulates the backend infrastructure of a stock trading platform (similar to Zerodha or Groww). Users can manage a stock portfolio, track buy/sell transactions, and set price alerts that fire automatically in the background — without blocking the main API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (via Mongoose) |
| Cache | Redis |
| Job Queue | BullMQ |
| Deployment | Railway |
| Containerization | Docker |

---

## Architecture

```
Client Request
      │
      ▼
 Express Server
      │
      ├── Helmet (security headers)
      ├── CORS
      ├── Morgan (request logging)
      └── express.json()
      │
      ▼
   Router Layer
  /api/users  /api/portfolio  /api/alerts
      │
      ▼
 Controller Layer
 (handles req/res only)
      │
      ▼
 Service Layer
 ┌────┴────┐
 │         │
MongoDB   Redis Cache
(primary) (cache-aside)
      
Background (independent of requests):
┌─────────────────────────────────┐
│  Alert Scheduler (every 30s)    │
│         │                       │
│         ▼                       │
│   BullMQ Queue (Redis)          │
│         │                       │
│         ▼                       │
│   Alert Worker (concurrency=5)  │
│         │                       │
│         ▼                       │
│   Check prices → Trigger alerts │
└─────────────────────────────────┘
```

---

## Features

- **Portfolio Management** — buy and sell stocks with automatic average price calculation
- **Transaction History** — full audit trail of every trade, sorted newest first
- **Price Alerts** — set ABOVE/BELOW alerts that fire automatically via background workers
- **Redis Caching** — cache-aside pattern with automatic invalidation on writes
- **Async Job Pipeline** — BullMQ processes alerts in background, completely decoupled from API requests
- **Compound Indexes** — optimized MongoDB queries for fast portfolio and alert lookups
- **Graceful Error Handling** — centralized error handler for Mongoose validation, duplicate keys, and cast errors
- **Health Check Endpoint** — for monitoring and uptime checks

---

## API Reference

### Health

```
GET /health
```
Returns server status and uptime.

---

### Users

```
POST   /api/users          Create a new user
GET    /api/users          Get all users
GET    /api/users/:id      Get user by ID
```

**Create user request body:**
```json
{
  "name": "Kishor Solanki",
  "email": "kishor@example.com"
}
```

---

### Portfolio

```
POST   /api/portfolio/buy                    Buy shares
POST   /api/portfolio/sell                   Sell shares
GET    /api/portfolio/:userId                Get portfolio (cached)
GET    /api/portfolio/:userId/transactions   Transaction history
```

**Buy stock request body:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "symbol": "INFY",
  "quantity": 10,
  "price": 1500
}
```

**Get portfolio response:**
```json
{
  "success": true,
  "source": "cache",
  "count": 1,
  "data": [
    {
      "symbol": "INFY",
      "quantity": 10,
      "buyPrice": 1500,
      "exchange": "NSE"
    }
  ]
}
```

The `source` field tells you whether the response came from `"cache"` or `"db"`.

---

### Alerts

```
POST   /api/alerts                       Create price alert
GET    /api/alerts/:userId               Get active alerts
GET    /api/alerts/:userId/history       Get triggered alerts
```

**Create alert request body:**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "symbol": "INFY",
  "targetPrice": 1400,
  "condition": "BELOW"
}
```

`condition` is either `"ABOVE"` or `"BELOW"`.

Once created, the alert is checked immediately via BullMQ and then every 30 seconds until it triggers. When triggered, `triggered` becomes `true` and `triggeredAt` is recorded.

---

## Getting Started

### Prerequisites

- Node.js v18+
- Docker (for MongoDB and Redis)

### Local Setup

**1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/stock-tracker.git
cd stock-tracker
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start MongoDB and Redis via Docker:**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
docker run -d --name redis   -p 6379:6379   redis:alpine
```

**4. Create `.env` file:**
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/stocktracker
REDIS_URL=redis://localhost:6379
CACHE_TTL=600
NODE_ENV=development
```

**5. Start the server:**
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3000
✅ MongoDB connected: localhost
✅ Redis connected
📋 Alert queue initialized
👷 Alert worker started
🕐 Alert scheduler started — checking every 30 seconds
```

### Run Tests

```bash
node test.js
```

This runs a full end-to-end test — creates a user, buys stock, sets an alert, waits for the worker to trigger it, sells stock, and checks transaction history.

---

## Project Structure

```
stock-tracker/
├── server.js                   # Entry point — wires everything together
├── test.js                     # End-to-end test script
├── .env                        # Local environment variables (not committed)
└── src/
    ├── config/
    │   ├── db.js               # MongoDB connection with graceful exit
    │   └── redis.js            # Redis client with error handling
    ├── models/
    │   ├── User.js             # Email uniqueness, validation
    │   ├── Portfolio.js        # Compound index { userId, symbol }
    │   ├── Alert.js            # Two indexes for user and symbol queries
    │   └── Transaction.js      # Sorted index { userId, createdAt: -1 }
    ├── controllers/
    │   ├── userController.js
    │   ├── portfolioController.js
    │   └── alertController.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── portfolioRoutes.js
    │   └── alertRoutes.js
    ├── middlewares/
    │   └── errorHandler.js     # Handles ValidationError, CastError, code 11000
    ├── utils/
    │   └── cache.js            # getCache, setCache, deleteCache with fallback
    └── queues/
        ├── alertQueue.js       # BullMQ queue with retry + exponential backoff
        ├── alertProcessor.js   # Worker with concurrency=5
        └── alertScheduler.js   # Adds jobs every 30 seconds
```

---

## Key Engineering Decisions

### Normalized Schema over Embedding

Transactions are stored in a separate collection instead of being embedded inside Portfolio documents. This prevents the unbounded array anti-pattern — an active trader could have thousands of transactions, which would cause MongoDB documents to hit the 16MB limit and degrade query performance.

### Cache-Aside Pattern

Portfolio data is cached in Redis after the first database read. On subsequent requests the cache is served directly, skipping MongoDB entirely. When a user buys or sells stock, the cache key is deleted immediately so the next read fetches fresh data from the database.

```
Read:  check Redis → miss → query MongoDB → store in Redis → return
Write: update MongoDB → delete Redis key
```

### Decoupled Alert Processing

Price alerts are not checked inside the API request. When a user creates an alert, the API responds in ~6ms after saving to the database. A BullMQ job is added to the queue independently. The worker picks it up, checks the price, and updates the alert — all without the user waiting.

This means a slow price API or a spike in alert checks never affects the response time of portfolio or user endpoints.

### Exponential Backoff on Job Failures

If a job fails (e.g. price API is temporarily down), BullMQ retries it with increasing delays:

```
1st retry → wait 2 seconds
2nd retry → wait 4 seconds
3rd retry → wait 8 seconds
```

This prevents hammering a failing service and improves overall pipeline reliability.

---

## Performance Optimizations

### Compound Index on Portfolio

```js
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });
```

Without this index, `Portfolio.find({ userId })` performs a full collection scan — O(n) where n is the total number of portfolio documents across all users. With this index, MongoDB performs a B-tree lookup — O(log n). At scale this is the difference between a 500ms query and a 5ms query.

### Two Indexes on Alert

```js
alertSchema.index({ userId: 1, triggered: 1 }); // for GET /api/alerts/:userId
alertSchema.index({ symbol: 1, triggered: 1 }); // for worker — find all alerts for a symbol
```

Different query patterns need different indexes. The API filters by user. The background worker filters by symbol. Both get index-backed lookups instead of collection scans.

### Redis Graceful Degradation

Every Redis operation is wrapped in try/catch. If Redis goes down, cache reads return `null` and the app falls back to MongoDB transparently. The API never returns a 500 error because of a Redis failure.

---

## Deployment

This project is deployed on Railway with three services:

- **stock-tracker** — Node.js app (this repo)
- **MongoDB** — managed database
- **Redis** — managed cache + job queue

Environment variables are injected by Railway at runtime. The BullMQ worker and scheduler run inside the same Node.js process as the API server and stay alive 24/7.

**Live URL:** `https://stock-tracker-production-ed21.up.railway.app/health`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CACHE_TTL` | Cache expiry in seconds | `600` |
| `NODE_ENV` | Environment | `development` |

---

## Author

**Kishor Solanki**  
B.Tech ECE — IIIT Surat  
[LinkedIn](https://linkedin.com) · [GitHub](https://github.com)
