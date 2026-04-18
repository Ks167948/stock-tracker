const express = require('express');
const router = express.Router();
const {
  createAlert,
  getUserAlerts,
  getAlertHistory,
} = require('../controllers/alertController');

router.post('/',                    createAlert);
router.get('/:userId',              getUserAlerts);
router.get('/:userId/history',      getAlertHistory);

module.exports = router;