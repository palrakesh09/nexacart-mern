import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { deleteProduct, fetchProducts } from "../api/productApi";
import { selectCurrentUser } from "../redux/slices/authSlice";

const ProductsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async (search = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProducts(search);
      setProducts(data);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Failed to load products. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadProducts(keyword);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Failed to delete product.";
      setError(message);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-slate-400 mt-1">Browse our latest items</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search products..."
            className="flex-1 sm:w-64 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error ? <p className="text-red-400 mb-4">{error}</p> : null}

      {loading ? (
        <p className="text-slate-400">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-slate-400">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isAdmin={Boolean(user?.isAdmin)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ProductsPage;
