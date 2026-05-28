const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    shippingInfo: {
      address: { type: String, required: true, default: "Not Specified" },
      city: { type: String, required: true, default: "Not Specified" },
      postalCode: { type: String, required: true, default: "000000" },
      country: { type: String, required: true, default: "Not Specified" },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: "Stripe",
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    paymentResult: {
      paymentIntentId: { type: String },
      status: { type: String },
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
    },
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

