import { createSlice } from "@reduxjs/toolkit";

const persistedUser = localStorage.getItem("nexacartUser");

const initialState = {
  user: persistedUser ? JSON.parse(persistedUser) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("nexacartUser", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("nexacartUser");
    },
  },
});

export const { login, logout } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export default authSlice.reducer;
