import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchPracticeQuestions = createAsyncThunk(
  "content/fetchPracticeQuestions",
  async ({ section, difficulty, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/sections/${section}/practice`, {
        params: { difficulty, page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchPracticeQuestionList = createAsyncThunk(
  "content/fetchPracticeQuestionList",
  async ({ section, difficulty, type, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/sections/${section}/practice/list`, {
        params: { difficulty, type, page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchQuestion = createAsyncThunk(
  "content/fetchQuestion",
  async ({ section, id }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/sections/${section}/practice/${id}`);
      return response.data.question;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchMockTests = createAsyncThunk(
  "content/fetchMockTests",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get("/content/mock-tests", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchMockTest = createAsyncThunk(
  "content/fetchMockTest",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/mock-tests/${id}`);
      return response.data.mockTest;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchAudioUrl = createAsyncThunk(
  "content/fetchAudioUrl",
  async (key, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/audio/${encodeURIComponent(key)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  questions: [],
  practiceBySection: {},
  practiceMetaBySection: {},
  questionListBySection: {},
  questionListMetaBySection: {},
  currentQuestion: null,
  mockTests: [],
  currentMockTest: null,
  mockTestLimit: null,
  audioUrlsByKey: {},
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  loading: false,
  loadingList: false,
  loadingQuestion: false,
  error: null,
};

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Practice Questions
    builder
      .addCase(fetchPracticeQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPracticeQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.practiceSets || [];
        state.pagination = action.payload.pagination;
        const section = action.meta.arg.section;
        state.practiceBySection[section] = action.payload.practiceSets || [];
        state.practiceMetaBySection[section] = {
          pagination: action.payload.pagination,
          isPremium: action.payload.isPremium,
        };
      })
      .addCase(fetchPracticeQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch questions";
      });

    // Fetch Practice Question List (full per-question metadata)
    builder
      .addCase(fetchPracticeQuestionList.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchPracticeQuestionList.fulfilled, (state, action) => {
        state.loadingList = false;
        const section = action.meta.arg.section;
        state.questionListBySection[section] = action.payload.questions || [];
        state.questionListMetaBySection[section] = {
          pagination: action.payload.pagination,
          access: action.payload.access,
        };
      })
      .addCase(fetchPracticeQuestionList.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload?.message || "Failed to fetch question list";
      });

    // Fetch Single Question
    builder
      .addCase(fetchQuestion.pending, (state) => {
        state.loadingQuestion = true;
        state.error = null;
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.loadingQuestion = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.loadingQuestion = false;
        state.error = action.payload?.message || "Failed to fetch question";
      });

    // Fetch Mock Tests
    builder
      .addCase(fetchMockTests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMockTests.fulfilled, (state, action) => {
        state.loading = false;
        state.mockTests = action.payload.mockTests || [];
        state.pagination = action.payload.pagination;
        state.mockTestLimit = action.payload.mockTestLimit || null;
      })
      .addCase(fetchMockTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch mock tests";
      });

    // Fetch Single Mock Test
    builder
      .addCase(fetchMockTest.pending, (state) => {
        state.loadingQuestion = true;
        state.error = null;
      })
      .addCase(fetchMockTest.fulfilled, (state, action) => {
        state.loadingQuestion = false;
        state.currentMockTest = action.payload;
      })
      .addCase(fetchMockTest.rejected, (state, action) => {
        state.loadingQuestion = false;
        state.error = action.payload?.message || "Failed to fetch mock test";
      });

    // Fetch Audio URL
    builder
      .addCase(fetchAudioUrl.fulfilled, (state, action) => {
        state.audioUrlsByKey[action.meta.arg] = action.payload.audioUrl;
      })
      .addCase(fetchAudioUrl.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to fetch audio URL";
      });
  },
});

export const { clearError } = contentSlice.actions;
export default contentSlice.reducer;
