const express = require('express');
const router = express.Router();
const {
  buyStock,
  sellStock,
  getPortfolio,
  getTransactions,
} = require('../controllers/portfolioController');

router.post('/buy',                   buyStock);
router.post('/sell',                  sellStock);
router.get('/:userId',                getPortfolio);
router.get('/:userId/transactions',   getTransactions);

module.exports = router;