const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { getCache, setCache, deleteCache } = require('../utils/cache');

const cacheKey = (userId) => `portfolio:${userId}`;

// POST /api/portfolio/buy
const buyStock = async (req, res, next) => {
  try {
    const { userId, symbol, quantity, price } = req.body;

    // Check if user already holds this stock
    let holding = await Portfolio.findOne({ userId, symbol });

    if (holding) {
      // Recalculate average buy price
      const totalCost = holding.buyPrice * holding.quantity + price * quantity;
      holding.quantity += quantity;
      holding.buyPrice = totalCost / holding.quantity;
      await holding.save();
    } else {
      // First time buying this stock
      holding = await Portfolio.create({ userId, symbol, quantity, buyPrice: price });
    }

    // Record the transaction
    await Transaction.create({
      userId,
      symbol,
      type: 'BUY',
      quantity,
      price,
      total: price * quantity,
    });

    // Invalidate cache — portfolio changed
    await deleteCache(cacheKey(userId));

    res.status(201).json({
      success: true,
      data: holding,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/portfolio/sell
const sellStock = async (req, res, next) => {
  try {
    const { userId, symbol, quantity, price } = req.body;

    const holding = await Portfolio.findOne({ userId, symbol });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: `You don't own any ${symbol}`,
      });
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `You only have ${holding.quantity} shares of ${symbol}`,
      });
    }

    holding.quantity -= quantity;

    // If all shares sold, remove the holding entirely
    if (holding.quantity === 0) {
      await Portfolio.deleteOne({ userId, symbol });
    } else {
      await holding.save();
    }

    // Record the transaction
    await Transaction.create({
      userId,
      symbol,
      type: 'SELL',
      quantity,
      price,
      total: price * quantity,
    });

    // Invalidate cache
    await deleteCache(cacheKey(userId));

    res.json({
      success: true,
      message:
        holding.quantity === 0
          ? `Sold all ${symbol} shares`
          : `Sold ${quantity} shares of ${symbol}`,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/portfolio/:userId
const getPortfolio = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const key = cacheKey(userId);

    // Step 1 — check cache first
    const cached = await getCache(key);
    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        count: cached.length,
        data: cached,
      });
    }

    // Step 2 — cache miss, go to MongoDB
    const holdings = await Portfolio.find({ userId });

    // Step 3 — store in cache for next time
    await setCache(key, holdings);

    res.json({
      success: true,
      source: 'db',
      count: holdings.length,
      data: holdings,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/portfolio/:userId/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Uses index { userId: 1, createdAt: -1 } — newest first
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { buyStock, sellStock, getPortfolio, getTransactions };