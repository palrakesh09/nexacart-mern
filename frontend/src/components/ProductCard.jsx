import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "../redux/slices/cartSlice";

const ProductCard = ({ product, isAdmin, onDelete }) => {
  const dispatch = useDispatch();

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
        qty: 1,
      })
    );
    toast.success(`${product.name} added to cart`);
  };

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-900/20 hover:border-slate-700 transition-all duration-300 flex flex-col">
      <div className="aspect-4/3 bg-slate-800 overflow-hidden">
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

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-400">
            {product.category}
          </p>
          <h2 className="text-lg font-semibold mt-1">{product.name}</h2>
          <p className="text-slate-400 text-sm line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-xl font-bold text-emerald-400">
            ${Number(product.price).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">Stock: {product.countInStock}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            to={`/products/${product._id}`}
            className="flex-1 text-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
          >
            View
          </Link>
          {!isAdmin ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Add to Cart
            </button>
          ) : null}
          {isAdmin ? (
            <>
              <Link
                to={`/admin/products/${product._id}/edit`}
                className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-sm"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => onDelete(product._id)}
                className="px-3 py-2 rounded-lg border border-red-900 text-red-400 hover:bg-red-950 transition-colors text-sm"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
