const express = require('express');
const { getPlans, createOrder, getPaymentStatus } = require('../controllers/transactionController');
const router = express.Router();

router.get('/plans', getPlans);
router.post('/create-order', createOrder);
router.get('/payment-status', getPaymentStatus);

module.exports = router;