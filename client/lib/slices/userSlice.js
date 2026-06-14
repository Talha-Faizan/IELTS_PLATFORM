import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/profile");
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (updates, { rejectWithValue }) => {
    try {
      const response = await api.put("/user/profile", updates);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchUserProgress = createAsyncThunk(
  "user/fetchProgress",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/progress");
      return response.data.progress;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchUserSubmissions = createAsyncThunk(
  "user/fetchSubmissions",
  async ({ section, type, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/submissions", {
        params: { section, type, page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchUserUsage = createAsyncThunk(
  "user/fetchUsage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/usage");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchStudyPlan = createAsyncThunk(
  "user/fetchStudyPlan",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/study-plan");
      return response.data.studyPlan;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  profile: null,
  progress: null,
  submissions: [],
  submissionsPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  usage: null,
  studyPlan: null,
  isPremium: false,
  loading: false,
  loadingProgress: false,
  loadingSubmissions: false,
  loadingUsage: false,
  loadingStudyPlan: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch profile";
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update profile";
      });

    // Fetch Progress
    builder
      .addCase(fetchUserProgress.pending, (state) => {
        state.loadingProgress = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.loadingProgress = false;
        state.progress = action.payload;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.loadingProgress = false;
        state.error = action.payload?.message || "Failed to fetch progress";
      });

    // Fetch User Submissions
    builder
      .addCase(fetchUserSubmissions.pending, (state) => {
        state.loadingSubmissions = true;
        state.error = null;
      })
      .addCase(fetchUserSubmissions.fulfilled, (state, action) => {
        state.loadingSubmissions = false;
        state.submissions = action.payload.submissions || [];
        state.submissionsPagination = action.payload.pagination || state.submissionsPagination;
      })
      .addCase(fetchUserSubmissions.rejected, (state, action) => {
        state.loadingSubmissions = false;
        state.error = action.payload?.message || "Failed to fetch submissions";
      });

    // Fetch Usage
    builder
      .addCase(fetchUserUsage.pending, (state) => {
        state.loadingUsage = true;
        state.error = null;
      })
      .addCase(fetchUserUsage.fulfilled, (state, action) => {
        state.loadingUsage = false;
        state.usage = action.payload.limits || null;
        state.isPremium = !!action.payload.isPremium;
      })
      .addCase(fetchUserUsage.rejected, (state, action) => {
        state.loadingUsage = false;
        state.error = action.payload?.message || "Failed to fetch usage";
      });

    // Fetch Study Plan
    builder
      .addCase(fetchStudyPlan.pending, (state) => {
        state.loadingStudyPlan = true;
        state.error = null;
      })
      .addCase(fetchStudyPlan.fulfilled, (state, action) => {
        state.loadingStudyPlan = false;
        state.studyPlan = action.payload;
      })
      .addCase(fetchStudyPlan.rejected, (state, action) => {
        state.loadingStudyPlan = false;
        state.error = action.payload?.message || "Failed to fetch study plan";
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
