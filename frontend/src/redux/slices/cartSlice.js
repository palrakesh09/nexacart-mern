import { createSlice } from "@reduxjs/toolkit";

const persistedCartItems = localStorage.getItem("nexacartCartItems");

const initialState = {
  cartItems: persistedCartItems ? JSON.parse(persistedCartItems) : [],
};

const saveCart = (items) => {
  localStorage.setItem("nexacartCartItems", JSON.stringify(items));
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.cartItems.find((cartItem) => cartItem._id === item._id);

      if (existingItem) {
        const mergedQty = Math.min(
          existingItem.qty + (item.qty || 1),
          existingItem.countInStock || 99
        );
        state.cartItems = state.cartItems.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, ...item, qty: mergedQty } : cartItem
        );
      } else {
        state.cartItems.push({ ...item, qty: item.qty || 1 });
      }

      saveCart(state.cartItems);
    },
    setCartItemQty: (state, action) => {
      const { id, qty } = action.payload;
      state.cartItems = state.cartItems.map((item) => {
        if (item._id !== id) {
          return item;
        }
        const boundedQty = Math.max(1, Math.min(qty, item.countInStock || 99));
        return { ...item, qty: boundedQty };
      });
      saveCart(state.cartItems);
    },
    increaseQty: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.map((item) =>
        item._id === id
          ? { ...item, qty: Math.min(item.qty + 1, item.countInStock || 99) }
          : item
      );
      saveCart(state.cartItems);
    },
    decreaseQty: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.map((item) =>
        item._id === id ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      );
      saveCart(state.cartItems);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((item) => item._id !== action.payload);
      saveCart(state.cartItems);
    },
    clearCart: (state) => {
      state.cartItems = [];
      saveCart(state.cartItems);
    },
  },
});

export const { addToCart, setCartItemQty, increaseQty, decreaseQty, removeFromCart, clearCart } =
  cartSlice.actions;
export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartTotals = (state) => {
  const items = state.cart.cartItems;
  return items.reduce(
    (acc, item) => {
      acc.totalQuantity += item.qty;
      acc.totalAmount += item.qty * Number(item.price);
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );
};
export default cartSlice.reducer;
