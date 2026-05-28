import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import {
  deleteOrderAction,
  getAdminOrders,
  selectAdminOrders,
  selectOrdersActionLoading,
  selectOrdersError,
  selectOrdersLoading,
  updateOrderStatusAction,
} from "../redux/slices/orderSlice";
import { ORDER_STATUS_OPTIONS, STATUS_BADGE_CLASSES } from "../constants/orderStatus";

const AdminOrdersPage = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectAdminOrders);
  const loading = useSelector(selectOrdersLoading);
  const actionLoading = useSelector(selectOrdersActionLoading);
  const error = useSelector(selectOrdersError);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  useEffect(() => {
    dispatch(getAdminOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const idMatch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
      const customerMatch = order.user?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "All" || order.status === statusFilter;
      return (idMatch || customerMatch) && statusMatch;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
      pendingOrders: orders.filter((order) => order.status === "Pending").length,
    };
  }, [orders]);

  const handleStatusChange = async (id, status) => {
    const resultAction = await dispatch(updateOrderStatusAction({ id, status }));
    if (updateOrderStatusAction.fulfilled.match(resultAction)) {
      toast.success("Order status updated");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!cancelModalOrder) {
      return;
    }
    const resultAction = await dispatch(deleteOrderAction(cancelModalOrder._id));
    if (deleteOrderAction.fulfilled.match(resultAction)) {
      toast.success("Order cancelled/deleted successfully");
      setCancelModalOrder(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Orders Management</h1>
            <p className="text-slate-400 mt-1">Track and update all customer orders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Pending Orders</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">{stats.pendingOrders}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order ID or customer name"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="All">All Status</option>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-950">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Customer Name</th>
                <th className="text-left p-3">Products</th>
                <th className="text-left p-3">Total Amount</th>
                <th className="text-left p-3">Payment Status</th>
                <th className="text-left p-3">Order Status</th>
                <th className="text-left p-3">Created Date</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={8}>
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={8}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-800">
                    <td className="p-3 font-mono">{order._id.slice(-8)}</td>
                    <td className="p-3">{order.user?.name || "Guest"}</td>
                    <td className="p-3 text-slate-300 max-w-xs">
                      {order.orderItems?.map((item) => item.name).join(", ")}
                    </td>
                    <td className="p-3 text-emerald-400">${Number(order.totalPrice).toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs ${
                          order.isPaid
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-xs ${
                            STATUS_BADGE_CLASSES[order.status] ||
                            "bg-slate-500/20 text-slate-200 border-slate-500/30"
                          }`}
                        >
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          onChange={(event) => handleStatusChange(order._id, event.target.value)}
                          disabled={actionLoading}
                          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setCancelModalOrder(order)}
                        className="px-3 py-1.5 rounded-md border border-rose-900 text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cancelModalOrder ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-xl font-semibold">Confirm Cancellation</h3>
            <p className="text-slate-400 mt-2">
              Are you sure you want to cancel order{" "}
              <span className="font-mono">{cancelModalOrder._id.slice(-8)}</span>?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default AdminOrdersPage;
