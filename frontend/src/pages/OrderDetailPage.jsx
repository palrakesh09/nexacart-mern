import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { fetchOrderById } from "../api/orderApi";
import { ORDER_STATUS_OPTIONS, STATUS_BADGE_CLASSES } from "../constants/orderStatus";

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (requestError) {
        const message =
          requestError.response?.data?.message || "Failed to load order details.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const renderTimeline = (status) => {
    if (status === "Cancelled") {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center mt-6">
          <div className="w-12 h-12 rounded-full bg-red-500/25 border border-red-500/40 mx-auto flex items-center justify-center text-red-300 text-lg mb-2">
            ✕
          </div>
          <h4 className="font-semibold text-red-400">Order Cancelled</h4>
          <p className="text-slate-400 text-sm mt-1">This order has been cancelled and will not be processed.</p>
        </div>
      );
    }

    const currentIndex = ORDER_STATUS_OPTIONS.indexOf(status);
    const steps = ORDER_STATUS_OPTIONS.filter((step) => step !== "Cancelled");

    return (
      <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-slate-200 mb-6">Delivery Progress Timeline</h3>
        
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between relative px-2">
          {steps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={step} className="flex flex-col items-center flex-1 relative z-1">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-[3px] -z-1 transition-all duration-500 ${
                      index < currentIndex ? "bg-indigo-500" : "bg-slate-800"
                    }`}
                  />
                )}
                
                {/* Node */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCurrent 
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110" 
                      : isCompleted 
                        ? "bg-emerald-600 border-emerald-400 text-white" 
                        : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                
                {/* Label */}
                <span
                  className={`text-xs font-medium mt-3 text-center transition-all ${
                    isCurrent 
                      ? "text-indigo-400 font-semibold" 
                      : isCompleted 
                        ? "text-slate-200" 
                        : "text-slate-500"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical View */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${
                      isCurrent
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        : isCompleted
                          ? "bg-emerald-600 border-emerald-400 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`w-[2px] h-10 mt-1 ${
                        index < currentIndex ? "bg-indigo-500" : "bg-slate-800"
                      }`}
                    />
                  )}
                </div>
                <div className="pt-0.5">
                  <p 
                    className={`text-sm font-semibold ${
                      isCurrent ? "text-indigo-400" : isCompleted ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {step}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isCurrent ? "Active status" : isCompleted ? "Completed step" : "Upcoming step"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your order details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-2xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-100">Order Not Found</h2>
          <p className="text-slate-400 mt-2">{error || "The order details could not be retrieved."}</p>
          <Link
            to="/my-orders"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Back to My Orders
          </Link>
        </div>
      </Layout>
    );
  }

  const taxAmount = order.totalPrice * 0.08;
  const shippingAmount = order.totalPrice > 0 ? 5.99 : 0;
  const subtotal = order.totalPrice - taxAmount - shippingAmount;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Title */}
        <div>
          <Link to="/my-orders" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            ← Back to My Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
              <p className="text-slate-400 text-sm mt-1">
                Order date: <span className="text-slate-200 font-medium">{new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500 uppercase tracking-wide bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                ID: {order.orderId || order._id}
              </span>
              <span
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                  STATUS_BADGE_CLASSES[order.status] || "bg-slate-500/20 text-slate-200 border-slate-500/30"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Status */}
        {renderTimeline(order.status)}

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Left Column: Items */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Ordered Items</h3>
            
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div
                  key={item._id || item.product}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition-all"
                >
                  <img
                    src={item.image || "https://placehold.co/128x128?text=No+Image"}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-850 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-100 truncate hover:text-indigo-400 transition-colors">
                      <Link to={`/products/${item.product?._id || item.product}`}>
                        {item.name}
                      </Link>
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">
                      Qty: <span className="text-slate-200 font-medium">{item.qty}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-200">${Number(item.price).toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subtotal: ${(item.qty * Number(item.price)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping & Payment Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              
              {/* Shipping Address */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h4 className="font-bold text-slate-200 text-sm mb-3">Shipping Address</h4>
                <div className="text-sm text-slate-350 space-y-1">
                  <p className="font-semibold text-slate-200">{order.user?.name || "Customer"}</p>
                  <p>{order.shippingInfo?.address}</p>
                  <p>{order.shippingInfo?.city}, {order.shippingInfo?.postalCode}</p>
                  <p>{order.shippingInfo?.country}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h4 className="font-bold text-slate-200 text-sm mb-3">Payment Details</h4>
                <div className="text-sm text-slate-350 space-y-2">
                  <div>
                    <span className="text-slate-500 text-xs uppercase block">Payment Method</span>
                    <span className="font-medium text-slate-200">{order.paymentMethod || "Fake Payment Gateway"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase block">Payment Status</span>
                    <span
                      className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-semibold ${
                        order.isPaid
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {order.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Billing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Billing Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal > 0 ? subtotal.toFixed(2) : order.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (8%)</span>
                  <span>${taxAmount > 0 ? taxAmount.toFixed(2) : "$0.00"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span>${shippingAmount > 0 ? `$${shippingAmount.toFixed(2)}` : "$0.00"}</span>
                </div>
                
                <div className="border-t border-slate-800 my-3" />
                
                <div className="flex justify-between text-base font-bold text-slate-100">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-lg">${Number(order.totalPrice).toFixed(2)}</span>
                </div>
              </div>

              {order.isPaid && order.paidAt && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400">
                  ✓ Payment processed successfully on {new Date(order.paidAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
