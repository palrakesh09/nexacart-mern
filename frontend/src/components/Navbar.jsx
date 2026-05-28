import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectCurrentUser } from "../redux/slices/authSlice";
import { selectCartItems } from "../redux/slices/cartSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const cartItems = useSelector(selectCartItems);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/products" className="text-xl font-bold text-indigo-400">
          Nexacart
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/products" className="text-slate-300 hover:text-white">
            Products
          </Link>
          <Link to="/cart" className="text-slate-300 hover:text-white">
            Cart {cartCount > 0 ? `(${cartCount})` : ""}
          </Link>
          {user && !user.isAdmin ? (
            <Link to="/my-orders" className="text-slate-300 hover:text-white">
              My Orders
            </Link>
          ) : null}
          {user?.isAdmin ? (
            <>
              <Link to="/admin/dashboard" className="text-slate-300 hover:text-white">
                Dashboard
              </Link>
              <Link to="/admin/orders" className="text-slate-300 hover:text-white">
                Orders
              </Link>
              <Link to="/admin/products/new" className="text-slate-300 hover:text-white">
                Add Product
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-400 hidden sm:inline">
                Hi, {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
