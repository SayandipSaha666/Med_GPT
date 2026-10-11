const Razorpay = require("razorpay");
import { env } from "../config/env"
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});
module.exports = { razorpay };