import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createOrder as createOrderApi,
  deleteOrder as deleteOrderApi,
  fetchMyOrders as fetchMyOrdersApi,
  fetchOrders as fetchOrdersApi,
  updateOrderStatus as updateOrderStatusApi,
} from "../../api/orderApi";

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      return await createOrderApi(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create order");
    }
  }
);

export const fetchAdminOrders = createAsyncThunk(
  "orders/fetchAdminOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOrdersApi();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMyOrdersApi();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch your orders");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await updateOrderStatusApi(id, { status });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update status");
    }
  }
);

export const deleteOrderAction = createAsyncThunk(
  "orders/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      await deleteOrderApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete order");
    }
  }
);

// Backward-compatible aliases for existing files
export const getAdminOrders = fetchAdminOrders;
export const getMyOrdersAction = fetchMyOrders;
export const updateOrderStatusAction = updateOrderStatus;

const initialState = {
  adminOrders: [],
  myOrders: [],
  loading: false,
  actionLoading: false,
  error: "",
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // createOrder handlers
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchAdminOrders handlers
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchMyOrders handlers
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateOrderStatus handlers
      .addCase(updateOrderStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = "";
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.adminOrders = state.adminOrders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        );
        state.myOrders = state.myOrders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        );
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // deleteOrderAction handlers
      .addCase(deleteOrderAction.pending, (state) => {
        state.actionLoading = true;
        state.error = "";
      })
      .addCase(deleteOrderAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.adminOrders = state.adminOrders.filter((order) => order._id !== action.payload);
      })
      .addCase(deleteOrderAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError } = orderSlice.actions;
export const selectAdminOrders = (state) => state.orders.adminOrders;
export const selectMyOrders = (state) => state.orders.myOrders;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersActionLoading = (state) => state.orders.actionLoading;
export const selectOrdersError = (state) => state.orders.error;
export default orderSlice.reducer;
