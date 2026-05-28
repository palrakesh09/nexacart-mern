import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import {
  fetchMyOrders,
  selectMyOrders,
  selectOrdersError,
  selectOrdersLoading,
} from "../redux/slices/orderSlice";
import { STATUS_BADGE_CLASSES } from "../constants/orderStatus";

const MyOrdersPage = () => {
  const dispatch = useDispatch();
  const myOrders = useSelector(selectMyOrders);
  const loading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-slate-400 mt-1">Track your recent purchases and check delivery progress</p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading your orders...</p>
          </div>
        ) : null}

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : null}

        {!loading && !error && myOrders.length === 0 ? (
          <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <p className="text-xl font-semibold text-slate-100">No Orders Found</p>
            <p className="text-slate-400 mt-2">You haven't placed any orders yet. Start exploring our premium products!</p>
            <Link
              to="/products"
              className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : null}

        <div className="space-y-4">
          {myOrders.map((order) => (
            <article 
              key={order._id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group duration-300"
            >
              {/* Card Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order Placed</p>
                    <p className="text-sm text-slate-300 font-medium mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Price</p>
                    <p className="text-sm text-emerald-400 font-bold mt-0.5">
                      ${Number(order.totalPrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order ID</p>
                    <p className="text-sm font-mono text-slate-300 font-medium mt-0.5">
                      {order.orderId || order._id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full border text-xs font-semibold ${
                      order.isPaid
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>
                  
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full border text-xs font-semibold ${
                      STATUS_BADGE_CLASSES[order.status] || "bg-slate-500/20 text-slate-200 border-slate-500/30"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items Section with Images */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {order.orderItems?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-950/45 p-2 rounded-xl border border-slate-850">
                      <img
                        src={item.image || "https://placehold.co/64x64?text=No+Image"}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 max-w-[200px]">
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Qty: {item.qty} · ${Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  {order.orderItems?.length > 3 && (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-300 text-xs font-bold">
                      +{order.orderItems.length - 3}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:translate-x-0.5 duration-205"
                  >
                    View Details <span>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
