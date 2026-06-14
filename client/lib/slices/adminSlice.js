import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchAdminMetrics = createAsyncThunk(
  "admin/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/metrics");
      return response.data.metrics;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async ({ page = 1, limit = 20, search, status } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/users", {
        params: { page, limit, search, status },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateAdminUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/users/${id}`, updates);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAdminContentBlocks = createAsyncThunk(
  "admin/fetchContentBlocks",
  async ({ page = 1, limit = 20, section } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/content-blocks", {
        params: { page, limit, section },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createAdminContentBlock = createAsyncThunk(
  "admin/createContentBlock",
  async (contentBlock, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/content-blocks", contentBlock);
      return response.data.contentBlock;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteAdminContentBlock = createAsyncThunk(
  "admin/deleteContentBlock",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/content-blocks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAdminQuestions = createAsyncThunk(
  "admin/fetchQuestions",
  async ({ page = 1, limit = 20, section, type, difficulty, isPublished } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/questions", {
        params: { page, limit, section, type, difficulty, isPublished },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createAdminQuestion = createAsyncThunk(
  "admin/createQuestion",
  async (question, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/questions", question);
      return response.data.question;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateAdminQuestion = createAsyncThunk(
  "admin/updateQuestion",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/questions/${id}`, updates);
      return response.data.question;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteAdminQuestion = createAsyncThunk(
  "admin/deleteQuestion",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAdminMockTests = createAsyncThunk(
  "admin/fetchMockTests",
  async ({ page = 1, limit = 20, isPublished } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/mock-tests", {
        params: { page, limit, isPublished },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createAdminMockTest = createAsyncThunk(
  "admin/createMockTest",
  async (mockTest, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/mock-tests", mockTest);
      return response.data.mockTest;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateAdminMockTest = createAsyncThunk(
  "admin/updateMockTest",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/mock-tests/${id}`, updates);
      return response.data.mockTest;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteAdminMockTest = createAsyncThunk(
  "admin/deleteMockTest",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/mock-tests/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchExpertReviews = createAsyncThunk(
  "admin/fetchExpertReviews",
  async ({ page = 1, limit = 20, status } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/expert-reviews", {
        params: { page, limit, status },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const assignExpertReview = createAsyncThunk(
  "admin/assignExpertReview",
  async ({ id, reviewerId }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/expert-reviews/${id}/assign`, { reviewerId });
      return response.data.review;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const completeExpertReview = createAsyncThunk(
  "admin/completeExpertReview",
  async ({ id, reviewerNotes, revisedBandEstimate, detailedFeedback }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/expert-reviews/${id}/complete`, {
        reviewerNotes,
        revisedBandEstimate,
        detailedFeedback,
      });
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const uploadBulkContent = createAsyncThunk(
  "admin/uploadBulkContent",
  async (jsonData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/content/bulk-upload", jsonData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchQuestionAnalytics = createAsyncThunk(
  "admin/fetchQuestionAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/analytics/questions");
      return response.data.analytics;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  metrics: null,
  users: [],
  usersPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  questions: [],
  questionsPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  questionAnalytics: [],
  contentBlocks: [],
  contentBlocksPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  mockTests: [],
  mockTestsPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  expertReviews: [],
  expertReviewsPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  error: null,
  successMessage: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearAdminSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users || [];
        state.usersPagination = action.payload.pagination || state.usersPagination;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.map((user) =>
          user.id === action.payload.id ? { ...user, ...action.payload } : user
        );
        state.successMessage = "User updated";
      })
      .addCase(fetchAdminContentBlocks.fulfilled, (state, action) => {
        state.loading = false;
        state.contentBlocks = action.payload.contentBlocks || [];
        state.contentBlocksPagination = action.payload.pagination || state.contentBlocksPagination;
      })
      .addCase(createAdminContentBlock.fulfilled, (state, action) => {
        state.loading = false;
        state.contentBlocks.unshift(action.payload);
        state.successMessage = "Content Block created";
      })
      .addCase(deleteAdminContentBlock.fulfilled, (state, action) => {
        state.loading = false;
        state.contentBlocks = state.contentBlocks.filter((cb) => cb.id !== action.payload);
        state.successMessage = "Content Block deleted";
      })
      .addCase(fetchAdminQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions || [];
        state.questionsPagination = action.payload.pagination || state.questionsPagination;
      })
      .addCase(createAdminQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions.unshift(action.payload);
        state.successMessage = "Question created";
      })
      .addCase(updateAdminQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.map((question) =>
          question.id === action.payload.id ? { ...question, ...action.payload } : question
        );
        state.successMessage = "Question updated";
      })
      .addCase(deleteAdminQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.filter((question) => question.id !== action.payload);
        state.successMessage = "Question deleted";
      })
      .addCase(uploadBulkContent.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = `Bulk upload successful: Created ${action.payload.stats.contentBlocksCreated} content blocks and ${action.payload.stats.questionsCreated} questions`;
      })
      .addCase(fetchQuestionAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.questionAnalytics = action.payload || [];
      })
      .addCase(fetchAdminMockTests.fulfilled, (state, action) => {
        state.loading = false;
        state.mockTests = action.payload.mockTests || [];
        state.mockTestsPagination = action.payload.pagination || state.mockTestsPagination;
      })
      .addCase(createAdminMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.mockTests.unshift(action.payload);
        state.successMessage = "Mock test created";
      })
      .addCase(updateAdminMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.mockTests = state.mockTests.map((mockTest) =>
          mockTest.id === action.payload.id ? { ...mockTest, ...action.payload } : mockTest
        );
        state.successMessage = "Mock test updated";
      })
      .addCase(deleteAdminMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.mockTests = state.mockTests.filter((mockTest) => mockTest.id !== action.payload);
        state.successMessage = "Mock test deleted";
      })
      .addCase(fetchExpertReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.expertReviews = action.payload.reviews || [];
        state.expertReviewsPagination = action.payload.pagination || state.expertReviewsPagination;
      })
      .addCase(assignExpertReview.fulfilled, (state, action) => {
        state.loading = false;
        state.expertReviews = state.expertReviews.map((review) =>
          review.id === action.payload.id ? { ...review, ...action.payload } : review
        );
        state.successMessage = "Reviewer assigned";
      })
      .addCase(completeExpertReview.fulfilled, (state, action) => {
        state.loading = false;
        state.expertReviews = state.expertReviews.map((review) =>
          review.id === action.payload.id ? { ...review, status: "complete" } : review
        );
        state.successMessage = "Review completed";
      })
      .addMatcher((action) => action.type.startsWith("admin/") && action.type.endsWith("/pending"), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher((action) => action.type.startsWith("admin/") && action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Admin request failed";
      });
  },
});

export const { clearAdminError, clearAdminSuccess } = adminSlice.actions;
export default adminSlice.reducer;
