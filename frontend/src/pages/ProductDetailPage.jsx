import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { fetchProductById } from "../api/productApi";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { addToCart } from "../redux/slices/cartSlice";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (requestError) {
        const message =
          requestError.response?.data?.message ||
          "Failed to load product details.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product.countInStock === 0) {
      toast.error("This product is out of stock");
      return;
    }

    dispatch(
      addToCart({
        _id: product._id,
        name: product.name,
        image: product.image,
        price: Number(product.price),
        countInStock: product.countInStock,
        qty,
      })
    );
    toast.success(`${product.name} added to cart`);
    navigate("/cart");
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-400">Loading product...</p>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <p className="text-red-400">{error || "Product not found."}</p>
        <Link to="/products" className="text-indigo-400 mt-4 inline-block">
          Back to products
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/products" className="text-indigo-400 text-sm hover:text-indigo-300">
        ← Back to products
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No image
            </div>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-400">
            {product.category}
          </p>
          <h1 className="text-4xl font-bold mt-2">{product.name}</h1>
          {product.brand ? (
            <p className="text-slate-400 mt-2">Brand: {product.brand}</p>
          ) : null}

          <p className="text-3xl font-bold text-emerald-400 mt-6">
            ${Number(product.price).toFixed(2)}
          </p>
          <p className="text-slate-400 mt-2">
            {product.countInStock > 0
              ? `${product.countInStock} in stock`
              : "Out of stock"}
          </p>

          <p className="text-slate-300 mt-6 leading-relaxed">{product.description}</p>

          <div className="mt-8 flex gap-3 flex-wrap">
            {!user?.isAdmin ? (
              <>
                {product.countInStock > 0 ? (
                  <select
                    value={qty}
                    onChange={(event) => setQty(Number(event.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900"
                  >
                    {[...Array(product.countInStock).keys()].map((item) => (
                      <option key={item + 1} value={item + 1}>
                        Qty: {item + 1}
                      </option>
                    ))}
                  </select>
                ) : null}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.countInStock === 0}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Cart
                </button>
                <Link
                  to={`/checkout/${product._id}`}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  Buy Now
                </Link>
              </>
            ) : null}
            {user?.isAdmin ? (
              <Link
                to={`/admin/products/${product._id}/edit`}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-900 transition-colors"
              >
                Edit product
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
