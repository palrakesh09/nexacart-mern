const Stripe = require("stripe");
const Product = require("../models/Product");

const createPaymentIntent = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe secret key is not configured" });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const amount = Math.round(product.price * 100) * qty;
    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        productId: String(product._id),
        quantity: String(qty),
        userId: String(req.user._id),
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: "usd",
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
      },
      quantity: qty,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createPaymentIntent };
