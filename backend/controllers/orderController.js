const Order = require("../models/Order");
const Product = require("../models/Product");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      productId,
      qty,
      shippingInfo,
      paymentMethod = "Fake Payment Flow",
      paymentStatus = "succeeded",
      paymentIntentId,
      totalPrice,
    } = req.body;

    let finalOrderItems = [];
    let finalTotalPrice = 0;

    if (orderItems && orderItems.length > 0) {
      // Cart items checkout
      finalOrderItems = orderItems.map((item) => ({
        product: item._id || item.product,
        name: item.name,
        qty: Number(item.qty),
        image: item.image || "",
        price: Number(item.price),
      }));
      finalTotalPrice = Number(totalPrice);
    } else if (productId) {
      // Single product checkout
      const quantity = Number(qty || 1);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      finalOrderItems = [
        {
          product: product._id,
          name: product.name,
          qty: quantity,
          image: product.image || "",
          price: product.price,
        },
      ];
      finalTotalPrice = Number(product.price) * quantity;
    } else {
      return res.status(400).json({ message: "No items in order" });
    }

    if (!shippingInfo || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.country) {
      return res.status(400).json({ message: "Shipping info is required and must be complete" });
    }

    const friendlyOrderId = `NX-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paid = paymentStatus === "succeeded" || paymentStatus === "Paid";

    const order = await Order.create({
      user: req.user._id,
      orderItems: finalOrderItems,
      shippingInfo,
      totalPrice: finalTotalPrice,
      paymentMethod,
      paymentStatus,
      paymentResult: {
        paymentIntentId: paymentIntentId || friendlyOrderId,
        status: paymentStatus || "succeeded",
      },
      isPaid: paid,
      paidAt: paid ? new Date() : undefined,
      status: paid ? "Confirmed" : "Pending",
      orderStatus: paid ? "Confirmed" : "Pending",
      orderId: friendlyOrderId,
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name image");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = String(order.user._id) === String(req.user._id);
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.body.status) {
      if (!ORDER_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }
      order.status = req.body.status;
      order.orderStatus = req.body.status;

      if (req.body.status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = new Date();
        order.isPaid = true;
        order.paymentStatus = "succeeded";
        order.paidAt = order.paidAt || new Date();
      } else if (req.body.status === "Cancelled") {
        order.isDelivered = false;
        order.deliveredAt = undefined;
      } else if (req.body.status !== "Out for Delivery") {
        order.isDelivered = false;
      }
    }

    const updatedOrder = await order.save();
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();
    return res.json({ message: "Order removed" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
