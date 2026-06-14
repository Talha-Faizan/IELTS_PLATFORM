import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const createSubscriptionOrder = createAsyncThunk(
  "subscription/createOrder",
  async (plan, { rejectWithValue }) => {
    try {
      const response = await api.post("/subscriptions/create-order", { plan });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/subscriptions/status");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/subscriptions/cancel");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  order: null,
  subscription: null,
  userStatus: "free",
  loading: false,
  error: null,
  successMessage: null,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Create Order
    builder
      .addCase(createSubscriptionOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscriptionOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(createSubscriptionOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create subscription order";
      });

    // Fetch Status
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload.subscription;
        state.userStatus = action.payload.userStatus || "free";
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch subscription status";
      });

    // Cancel Subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.loading = false;
        state.subscription = null;
        state.userStatus = "free";
        state.successMessage = "Subscription cancelled";
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to cancel subscription";
      });
  },
});

export const { clearError, clearSuccessMessage } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
