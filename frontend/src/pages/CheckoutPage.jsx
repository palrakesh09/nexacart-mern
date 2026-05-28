import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { createPaymentIntent } from "../api/paymentApi";
import { createOrder } from "../redux/slices/orderSlice";
import { fetchProductById } from "../api/productApi";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Stripe checkout form
const StripeCheckoutForm = ({ amount, productName, productId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment submission failed");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
    } else if (paymentIntent?.status === "succeeded") {
      // Create order in MongoDB (direct purchase)
      const orderPayload = {
        productId,
        qty: 1,
        paymentMethod: "Stripe",
        paymentStatus: "succeeded",
        paymentIntentId: paymentIntent.id,
        shippingInfo: {
          address: "123 Stripe St",
          city: "Stripeville",
          postalCode: "94043",
          country: "United States",
        },
      };
      
      const resultAction = await dispatch(createOrder(orderPayload));
      if (createOrder.fulfilled.match(resultAction)) {
        setSuccess("Payment successful. Your order has been placed.");
        toast.success("Order placed successfully via Stripe!");
      } else {
        setError(resultAction.payload || "Failed to record order in backend");
      }
    } else {
      setSuccess("Payment is processing.");
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-slate-400 text-sm">Product</p>
        <p className="text-lg font-semibold text-slate-100">{productName}</p>
      </div>
      <div>
        <p className="text-slate-400 text-sm">Total</p>
        <p className="text-2xl font-bold text-emerald-400">
          ${(amount / 100).toFixed(2)}
        </p>
      </div>

      <PaymentElement />

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      {success ? <p className="text-emerald-400 text-sm">{success}</p> : null}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors font-medium cursor-pointer"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
};

// Main Checkout Page supporting Fallback Demo checkout
const CheckoutPage = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  
  // Checkout logic states
  const [useDemoCheckout, setUseDemoCheckout] = useState(!publishableKey);
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Demo payment details states
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("United States");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [fakeOrderId, setFakeOrderId] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  useEffect(() => {
    const initCheckout = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch detailed product
        const productData = await fetchProductById(productId);
        setProduct(productData);
        setAmount(productData.price * 100);

        if (publishableKey) {
          try {
            const data = await createPaymentIntent({ productId, quantity: 1 });
            setClientSecret(data.clientSecret);
          } catch (intentErr) {
            console.warn("Failed to create Stripe Intent, switching to Demo Checkout fallback", intentErr);
            setUseDemoCheckout(true);
          }
        }
      } catch (requestError) {
        const message =
          requestError.response?.data?.message ||
          "Unable to initialize checkout. Login may be required.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [productId]);

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: "night" },
    }),
    [clientSecret]
  );

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let index = 0, len = match.length; index < len; index += 4) {
      parts.push(match.substring(index, index + 4));
    }
    return parts.length > 0 ? parts.join(" ") : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    return v.length >= 2 ? `${v.slice(0, 2)}/${v.slice(2, 4)}` : v;
  };

  const handleDemoCheckout = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim() || !shippingCity.trim() || !shippingPostalCode.trim() || !shippingCountry.trim()) {
      toast.error("Please complete all shipping address fields");
      return;
    }
    if (!cardName.trim() || !cardNumber.replace(/\s/g, "").match(/^\d{16}$/) || !cardExpiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/) || !cardCvv.match(/^\d{3}$/)) {
      toast.error("Please enter valid credit card details");
      return;
    }

    setIsPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const orderPayload = {
      productId,
      qty: 1,
      shippingInfo: {
        address: shippingAddress,
        city: shippingCity,
        postalCode: shippingPostalCode,
        country: shippingCountry,
      },
      paymentMethod: "Fake Credit Card (Direct Buy)",
      paymentStatus: "succeeded",
    };

    try {
      const resultAction = await dispatch(createOrder(orderPayload));
      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;
        setFakeOrderId(order.orderId || `NX-${Date.now().toString().slice(-8)}`);
        setCreatedOrderId(order._id);
        setPaymentSuccess(true);
        toast.success("Order placed successfully!");
      } else {
        toast.error(resultAction.payload || "Failed to create order");
      }
    } catch (err) {
      toast.error(err.message || "Checkout connection failed");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Preparing secure checkout...</p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450 text-2xl mb-4">
            ⚠️
          </div>
          <p className="text-rose-400 font-medium">{error || "Product session failed."}</p>
          <Link to="/products" className="inline-block mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors">
            Back to Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link to={`/products/${productId}`} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            ← Back to product details
          </Link>
          <h1 className="text-3xl font-bold mt-2">Checkout Details</h1>
        </div>

        {/* Tab switchers if publishable key is present */}
        {publishableKey && clientSecret && !paymentSuccess ? (
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1.5">
            <button
              onClick={() => setUseDemoCheckout(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !useDemoCheckout ? "bg-indigo-600 text-white" : "text-slate-450 hover:text-slate-200"
              }`}
            >
              Stripe Payment
            </button>
            <button
              onClick={() => setUseDemoCheckout(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                useDemoCheckout ? "bg-indigo-600 text-white" : "text-slate-450 hover:text-slate-200"
              }`}
            >
              Demo Payment Flow
            </button>
          </div>
        ) : null}

        {/* Success Screen Display */}
        {paymentSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-3xl animate-bounce">
              🎉
            </div>
            <div>
              <h3 className="text-2xl font-bold text-emerald-400">Checkout Successful</h3>
              <p className="text-slate-350 text-sm mt-1">Your direct order has been registered in MongoDB.</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl max-w-sm mx-auto text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Order ID Reference</span>
                <span className="font-mono text-slate-300 font-bold">{fakeOrderId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Paid</span>
                <span className="text-emerald-400 font-bold">${Number(product.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Product Name</span>
                <span className="text-indigo-400 truncate max-w-[180px] font-semibold">{product.name}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-2">
              <Link
                to={`/orders/${createdOrderId}`}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
              >
                View Order Timeline
              </Link>
              <Link
                to="/products"
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-450 hover:bg-slate-850 hover:text-slate-200 font-medium text-sm transition-colors text-center"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            {useDemoCheckout ? (
              /* DEMO / FAKE PAYMENT FLOW */
              <form onSubmit={handleDemoCheckout} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Demo Purchase Flow</h3>
                  <p className="text-slate-450 text-xs mt-1">Please enter demo delivery & mock credit card info.</p>
                </div>

                {/* Product Summary Row */}
                <div className="flex gap-4 p-3 bg-slate-950 rounded-xl border border-slate-850 items-center">
                  <img
                    src={product.image || "https://placehold.co/64x64?text=No+Image"}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-350 uppercase">Purchasing</p>
                    <p className="text-sm font-bold text-slate-100 truncate">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">${Number(product.price).toFixed(2)}</p>
                  </div>
                </div>

                {/* Section: Shipping */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-indigo-400">Shipping Details</h4>
                  <div>
                    <label htmlFor="addressInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Street Address</label>
                    <input
                      id="addressInputDirect"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Main St"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cityInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">City</label>
                      <input
                        id="cityInputDirect"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="New York"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="postalInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Postal Code</label>
                      <input
                        id="postalInputDirect"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        placeholder="10001"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="countryInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Country</label>
                    <input
                      id="countryInputDirect"
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Section: Credit Card Details */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-indigo-400">Card Payment</h4>
                  
                  {/* Card Visual */}
                  <div className="bg-linear-to-br from-indigo-850 to-indigo-950 border border-indigo-750/30 rounded-2xl p-4 text-slate-300 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-indigo-200">
                      <span>NEXACART DIRECT PURCHASE</span>
                      <span className="italic">DEMO ONLY</span>
                    </div>
                    <p className="font-mono tracking-widest text-slate-100 text-base">{cardNumber || "•••• •••• •••• ••••"}</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Cardholder</span>
                        <span className="font-bold truncate max-w-[160px] block">{cardName || "NAME"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Expiry</span>
                        <span className="font-mono font-bold block">{cardExpiry || "MM/YY"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="cardNameInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cardholder Name</label>
                      <input
                        id="cardNameInputDirect"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="cardNumberInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Card Number</label>
                      <input
                        id="cardNumberInputDirect"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 1234 5678"
                        maxLength={19}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="expiryInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Expiry Date</label>
                        <input
                          id="expiryInputDirect"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvvInputDirect" className="text-[10px] uppercase font-bold text-slate-500 block mb-1">CVV</label>
                        <input
                          id="cvvInputDirect"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          placeholder="123"
                          maxLength={3}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Demo Order...
                    </>
                  ) : (
                    `Place Demo Order - $${Number(product.price).toFixed(2)}`
                  )}
                </button>
              </form>
            ) : (
              /* STRIPE PAYMENT GATEWAY */
              clientSecret ? (
                <Elements stripe={stripePromise} options={options}>
                  <StripeCheckoutForm amount={amount} productName={product.name} productId={productId} />
                </Elements>
              ) : (
                <p className="text-slate-400">Payment session unavailable.</p>
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;
