import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../components/Layout";
import { deleteProduct, fetchProducts } from "../api/productApi";
import { getAdminOrders, selectAdminOrders } from "../redux/slices/orderSlice";

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectAdminOrders);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [productData] = await Promise.all([fetchProducts()]);
      setProducts(productData);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || "Failed to load admin dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    dispatch(getAdminOrders());
  }, [dispatch]);

  const orderStats = useMemo(() => {
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "Pending").length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    };
  }, [orders]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((item) => item._id !== productId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete product.");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage products and orders</p>
        </div>
        <Link
          to="/admin/products/new"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/admin/orders"
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
        >
          <p className="text-slate-400 text-sm">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{orderStats.totalOrders}</p>
        </Link>
        <Link
          to="/admin/orders"
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
        >
          <p className="text-slate-400 text-sm">Pending Orders</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{orderStats.pendingOrders}</p>
        </Link>
        <Link
          to="/admin/orders"
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
        >
          <p className="text-slate-400 text-sm">Revenue</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            ${orderStats.totalRevenue.toFixed(2)}
          </p>
        </Link>
      </div>

      {error ? <p className="text-red-400 mb-4">{error}</p> : null}

      {loading ? (
        <p className="text-slate-400">Loading dashboard...</p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-t border-slate-800">
                      <td className="p-3">{product.name}</td>
                      <td className="p-3 text-slate-300">{product.category}</td>
                      <td className="p-3 text-emerald-400">${Number(product.price).toFixed(2)}</td>
                      <td className="p-3 text-slate-300">{product.countInStock}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product._id)}
                            className="px-3 py-1 rounded-md border border-red-900 text-red-400 hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Orders</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-300">
                Orders management has moved to a dedicated page for better workflow.
              </p>
              <Link
                to="/admin/orders"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Open Orders Management
              </Link>
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboardPage;
