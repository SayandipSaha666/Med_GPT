const express = require('express');
const { getPlans, createOrder, verifyPayment } = require('../controllers/transactionController');
const router = express.Router();

router.get('/plans', getPlans);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;