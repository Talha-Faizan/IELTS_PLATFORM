import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const createSubmission = createAsyncThunk(
  "submission/create",
  async (submissionData, { rejectWithValue }) => {
    try {
      const response = await api.post("/submissions", submissionData);
      return response.data.submission;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const uploadAudio = createAsyncThunk(
  "submission/uploadAudio",
  async (files, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("audio", file));

      const response = await api.post("/submissions/audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.audioKeys;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchSubmission = createAsyncThunk(
  "submission/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/submissions/${id}`);
      return response.data.submission;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const autosaveDraft = createAsyncThunk(
  "submission/autosaveDraft",
  async ({ submissionId, text }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/submissions/${submissionId}/draft`, { text });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const requestExpertReview = createAsyncThunk(
  "submission/requestExpertReview",
  async (submissionId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/expert-review`);
      return response.data.expertReview;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const rateFeedback = createAsyncThunk(
  "submission/rateFeedback",
  async ({ submissionId, rating }, { rejectWithValue }) => {
    try {
      const response = await api.post("/submissions/feedback-rating", {
        submissionId,
        rating,
      });
      return { ...response.data, submissionId, rating };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  currentSubmission: null,
  submissions: [],
  audioUrls: [],
  loading: false,
  loadingAudio: false,
  error: null,
  successMessage: null,
};

const submissionSlice = createSlice({
  name: "submission",
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
    // Create Submission
    builder
      .addCase(createSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
        state.successMessage = "Submission created successfully";
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create submission";
      });

    // Upload Audio
    builder
      .addCase(uploadAudio.pending, (state) => {
        state.loadingAudio = true;
        state.error = null;
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.loadingAudio = false;
        state.audioUrls = action.payload;
        state.successMessage = "Audio uploaded successfully";
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.loadingAudio = false;
        state.error = action.payload?.message || "Failed to upload audio";
      });

    // Fetch Submission
    builder
      .addCase(fetchSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch submission";
      });

    // Autosave Draft
    builder
      .addCase(autosaveDraft.pending, (state) => {
        state.error = null;
      })
      .addCase(autosaveDraft.fulfilled, (state) => {
        state.successMessage = "Draft saved";
      })
      .addCase(autosaveDraft.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to save draft";
      });

    // Request Expert Review
    builder
      .addCase(requestExpertReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestExpertReview.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Expert review requested successfully";
      })
      .addCase(requestExpertReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to request expert review";
      });

    // Rate Feedback
    builder
      .addCase(rateFeedback.pending, (state) => {
        state.error = null;
      })
      .addCase(rateFeedback.fulfilled, (state, action) => {
        if (state.currentSubmission?.id === action.payload.submissionId) {
          state.currentSubmission.feedbackRating = action.payload.rating;
        }
        state.successMessage = "Thank you for your feedback";
      })
      .addCase(rateFeedback.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to rate feedback";
      });
  },
});

export const { clearError, clearSuccessMessage } = submissionSlice.actions;
export default submissionSlice.reducer;
