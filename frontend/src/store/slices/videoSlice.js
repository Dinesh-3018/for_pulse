import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { videoService } from "../../services/api";

export const fetchVideos = createAsyncThunk(
  "videos/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const data = await videoService.getVideos(params);
      return {
        videos: data.data.videos,
        pagination: data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch videos"
      );
    }
  }
);

export const uploadVideo = createAsyncThunk(
  "videos/upload",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      return await videoService.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        dispatch(setUploadProgress(percentCompleted));
      });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Upload failed");
    }
  }
);

const initialState = {
  videos: [],
  currentVideo: null,
  uploading: false,
  uploadProgress: 0,
  isLoading: false,
  error: null,
  uploadSuccess: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalVideos: 0,
    limit: 10,
  },
};

const videoSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    setProcessingProgress: (state, action) => {
      const { videoId, progress } = action.payload;
      const video = state.videos.find((v) => v._id == videoId);
      console.log(
        `[Socket] Processing ${progress}% for ${videoId}:`,
        video ? "FOUND" : "NOT FOUND"
      );
      if (video) {
        // Only update progress if not already completed
        if (video.status !== "completed") {
          video.processingProgress = progress;
          if (video.status === "pending") {
            video.status = "processing";
          }
        } else {
          console.log(
            `[Socket] Ignoring progress update for completed video ${videoId}`
          );
        }
      }
    },
    setAnalysisProgress: (state, action) => {
      const { videoId, progress, detectedLabels } = action.payload;
      const video = state.videos.find((v) => v._id == videoId);
      console.log(
        `[Socket] Analysis ${progress}% for ${videoId}:`,
        video ? "FOUND" : "NOT FOUND"
      );
      if (video) {
        // Only update if not already completed
        if (video.status !== "completed") {
          video.processingProgress = progress;
          if (detectedLabels) {
            video.detectedLabels = detectedLabels;
          }
          if (video.status === "pending") {
            video.status = "processing";
          }
        } else {
          // Video is completed, but we can still update detected labels if they're more recent
          console.log(
            `[Socket] Video ${videoId} already completed, ignoring progress update`
          );
          if (detectedLabels && detectedLabels.length > 0) {
            video.detectedLabels = detectedLabels;
          }
        }
      }
    },
    setVideoStatus: (state, action) => {
      const { videoId, status, sensitivityStatus } = action.payload;
      const video = state.videos.find((v) => v._id == videoId);
      console.log(
        `[Socket] Status ${status} for ${videoId}:`,
        video ? "FOUND" : "NOT FOUND"
      );
      if (video) {
        // Prevent downgrade from completed to processing
        if (video.status === "completed" && status === "processing") {
          console.warn(
            `[Socket] Ignoring status downgrade from completed to processing for ${videoId}`
          );
          return;
        }

        video.status = status;
        if (sensitivityStatus) {
          video.sensitivityStatus = sensitivityStatus;
        }
        if (status === "completed") {
          video.processingProgress = 100;
        }
      }
    },
    resetUploadState: (state) => {
      state.uploading = false;
      state.uploadSuccess = false;
      state.uploadProgress = 0;
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload Video
      .addCase(uploadVideo.pending, (state) => {
        state.uploading = true;
        state.uploadSuccess = false;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadSuccess = true;
        state.uploadProgress = 100;

        if (
          action.payload &&
          action.payload.data &&
          action.payload.data.video
        ) {
          state.videos = [action.payload.data.video, ...state.videos];
        }
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setProcessingProgress,
  setAnalysisProgress,
  setVideoStatus,
  resetUploadState,
  setUploadProgress,
} = videoSlice.actions;
export default videoSlice.reducer;
