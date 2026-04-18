const Alert = require('../models/Alert');
const { alertQueue } = require('../queues/alertQueue');

// POST /api/alerts
const createAlert = async (req, res, next) => {
  try {
    const { userId, symbol, targetPrice, condition } = req.body;

    const alert = await Alert.create({
      userId,
      symbol,
      targetPrice,
      condition,
    });

    // Add an immediate check job for this symbol
    // User just set an alert — check right away instead of waiting 30 seconds
    await alertQueue.add(
      `immediate-check-${symbol}`,
      { symbol },
      { jobId: `immediate-${symbol}-${Date.now()}` }
    );

    res.status(201).json({
      success: true,
      message: `Alert created — will notify when ${symbol} goes ${condition} ₹${targetPrice}`,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/:userId
const getUserAlerts = async (req, res, next) => {
  try {
    // Uses index: { userId: 1, triggered: 1 }
    const alerts = await Alert.find({
      userId: req.params.userId,
      triggered: false,
    });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/:userId/history
const getAlertHistory = async (req, res, next) => {
  try {
    const alerts = await Alert.find({
      userId: req.params.userId,
      triggered: true,
    }).sort({ triggeredAt: -1 });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAlert, getUserAlerts, getAlertHistory };