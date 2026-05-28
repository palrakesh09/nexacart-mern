import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import {
  clearCart,
  decreaseQty,
  increaseQty,
  removeFromCart,
  selectCartItems,
  selectCartTotals,
} from "../redux/slices/cartSlice";
import { createOrder } from "../redux/slices/orderSlice";

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const { totalQuantity, totalAmount } = useSelector(selectCartTotals);
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [fakeOrderId, setFakeOrderId] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  // Form states - Shipping Info
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("United States");

  // Form states - Payment details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const taxAmount = useMemo(() => totalAmount * 0.08, [totalAmount]);
  const shippingAmount = useMemo(() => (totalAmount > 0 ? 5.99 : 0), [totalAmount]);
  const grandTotal = totalAmount + taxAmount + shippingAmount;

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
    toast.success("Item removed from cart");
  };

  const validateShipping = () => {
    if (!shippingAddress.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!shippingCity.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!shippingPostalCode.trim()) {
      toast.error("Postal code is required");
      return false;
    }
    if (!shippingCountry.trim()) {
      toast.error("Country is required");
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (!cardName.trim()) {
      toast.error("Cardholder name is required");
      return false;
    }
    if (!cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      toast.error("Enter a valid 16-digit card number");
      return false;
    }
    if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
      toast.error("Enter expiry date in MM/YY format");
      return false;
    }
    if (!cardCvv.match(/^\d{3}$/)) {
      toast.error("Enter a valid 3-digit CVV");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (validateShipping()) {
        setCheckoutStep(2);
      }
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!validatePayment()) {
      return;
    }

    setIsPaying(true);
    // Add micro-delay for visual aesthetic
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const orderPayload = {
      orderItems: cartItems.map((item) => ({
        _id: item._id,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
      })),
      totalPrice: grandTotal,
      shippingInfo: {
        address: shippingAddress,
        city: shippingCity,
        postalCode: shippingPostalCode,
        country: shippingCountry,
      },
      paymentMethod: "Fake Credit Card",
      paymentStatus: "succeeded",
    };

    try {
      const resultAction = await dispatch(createOrder(orderPayload));
      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;
        setFakeOrderId(order.orderId || `NX-${Date.now().toString().slice(-8)}`);
        setCreatedOrderId(order._id);
        setPaymentSuccess(true);
        setCheckoutStep(3);
        dispatch(clearCart());
        toast.success("Payment successful! Order placed.");
      } else {
        toast.error(resultAction.payload || "Order creation failed.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to connect to backend");
    } finally {
      setIsPaying(false);
    }
  };

  const resetCheckoutModal = () => {
    setShowPaymentModal(false);
    setCheckoutStep(1);
    setPaymentSuccess(false);
    setFakeOrderId("");
    setCreatedOrderId("");
    setShippingAddress("");
    setShippingCity("");
    setShippingPostalCode("");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  // Card formatting utilities
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let index = 0, len = match.length; index < len; index += 4) {
      parts.push(match.substring(index, index + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Cart</h1>
          <p className="text-slate-400 mt-1">Review items and continue to checkout</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-2xl mb-4">
              🛒
            </div>
            <p className="text-xl font-semibold text-slate-100">Your cart is empty</p>
            <p className="text-slate-400 mt-2">Looks like you haven't added anything yet. Explore our collection!</p>
            <Link
              to="/products"
              className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-700 transition-all duration-300"
                >
                  <img
                    src={item.image || "https://placehold.co/128x128?text=No+Image"}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover border border-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg text-slate-100 truncate">{item.name}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Price: ${Number(item.price).toFixed(2)}
                    </p>
                    <p className="text-indigo-400 text-sm font-semibold mt-1">
                      Subtotal: ${(item.qty * Number(item.price)).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => dispatch(decreaseQty(item._id))}
                      className="w-9 h-9 rounded-lg border border-slate-700 hover:bg-slate-850 transition-colors font-bold text-slate-300"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-slate-200">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => dispatch(increaseQty(item._id))}
                      disabled={item.qty >= item.countInStock}
                      className="w-9 h-9 rounded-lg border border-slate-700 hover:bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-slate-300"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item._id)}
                    className="px-3.5 py-2 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors text-sm font-medium self-end sm:self-auto"
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>

            {/* Billing Summary Sidebar */}
            <aside className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 h-fit sticky top-24 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Order Summary</h2>
                <p className="text-slate-400 text-xs mt-0.5">Secure payment experience (demo gateway)</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Total Quantity</span>
                  <span className="font-semibold text-slate-200">{totalQuantity}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-250">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (8%)</span>
                  <span className="text-slate-250">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="text-slate-250">${shippingAmount.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-slate-800 my-2" />
                
                <div className="flex justify-between text-base font-bold text-slate-100">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-lg">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutStep(1);
                  setShowPaymentModal(true);
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] text-sm cursor-pointer"
              >
                Checkout Now
              </button>
            </aside>
          </div>
        )}
      </div>

      {/* Interactive Checkout Modal */}
      {showPaymentModal ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Step Indicators */}
            {checkoutStep < 3 ? (
              <div className="flex items-center gap-4 mb-6 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    checkoutStep === 1 ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    {checkoutStep === 1 ? "1" : "✓"}
                  </div>
                  <span className={`text-xs font-semibold ${checkoutStep === 1 ? "text-indigo-400" : "text-slate-450"}`}>
                    Shipping
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-800" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    checkoutStep === 2 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-800 text-slate-500"
                  }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold ${checkoutStep === 2 ? "text-indigo-400" : "text-slate-500"}`}>
                    Payment
                  </span>
                </div>
              </div>
            ) : null}

            {/* STEP 1: Shipping Details Form */}
            {checkoutStep === 1 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Shipping Details</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Please provide your precise delivery details.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="addressInput" className="text-xs font-semibold text-slate-400 block mb-1">Street Address</label>
                    <input
                      id="addressInput"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Main St, Apt 4B"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cityInput" className="text-xs font-semibold text-slate-400 block mb-1">City</label>
                      <input
                        id="cityInput"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="New York"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="postalInput" className="text-xs font-semibold text-slate-400 block mb-1">Postal Code</label>
                      <input
                        id="postalInput"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        placeholder="10001"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="countryInput" className="text-xs font-semibold text-slate-400 block mb-1">Country</label>
                    <input
                      id="countryInput"
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-semibold"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            ) : null}

            {/* STEP 2: Credit Card Form */}
            {checkoutStep === 2 ? (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Fake Payment Gateway</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Mock payment processing system for developers.</p>
                </div>

                {/* Amount details card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold">Total Payable</span>
                  <span className="text-emerald-400 font-bold text-xl">${grandTotal.toFixed(2)}</span>
                </div>

                {/* Animated credit card visual */}
                <div className="bg-linear-to-br from-indigo-800 to-indigo-950 border border-indigo-700/40 rounded-2xl p-5 shadow-lg text-slate-250 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-bold text-xs uppercase tracking-wider">Nexacart Gold Card</span>
                    <span className="text-xl font-bold italic text-indigo-200">DEMO</span>
                  </div>
                  <div className="text-lg font-mono tracking-widest text-slate-200 mb-6">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                      <span className="text-sm font-semibold truncate max-w-[180px] block">{cardName || "NAME ON CARD"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expires</span>
                      <span className="text-sm font-mono font-semibold block">{cardExpiry || "MM/YY"}</span>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="cardNameInput" className="text-xs font-semibold text-slate-400 block mb-1">Cardholder Name</label>
                    <input
                      id="cardNameInput"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardNumberInput" className="text-xs font-semibold text-slate-400 block mb-1">Card Number</label>
                    <input
                      id="cardNumberInput"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 1234 5678"
                      maxLength={19}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="expiryInput" className="text-xs font-semibold text-slate-400 block mb-1">Expiry Date</label>
                      <input
                        id="expiryInput"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="cvvInput" className="text-xs font-semibold text-slate-400 block mb-1">CVV</label>
                      <input
                        id="cvvInput"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        placeholder="123"
                        maxLength={3}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    disabled={isPaying}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-850 transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${grandTotal.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            ) : null}

            {/* STEP 3: Successful screen */}
            {checkoutStep === 3 && paymentSuccess ? (
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-4xl animate-bounce">
                  🎉
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-400">Payment Successful</h3>
                  <p className="text-slate-350 text-sm mt-1">Your fake order has been successfully logged in MongoDB.</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Order Reference ID</span>
                    <span className="font-mono text-slate-300 font-bold">{fakeOrderId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Price Paid</span>
                    <span className="text-emerald-400 font-bold">${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Payment Method</span>
                    <span className="text-slate-300 font-medium">Simulated Transaction</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-2">
                  <Link
                    to={`/orders/${createdOrderId}`}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors text-center"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    onClick={resetCheckoutModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 font-medium text-sm transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default CartPage;
