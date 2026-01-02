import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService, onboardingService } from "../../services/api";

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getMe();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);

export const savePreferences = createAsyncThunk(
  "auth/savePreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      const data = await onboardingService.savePreferences(preferences);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save preferences"
      );
    }
  }
);

export const updateStep = createAsyncThunk(
  "auth/updateStep",
  async (step, { rejectWithValue }) => {
    try {
      const data = await onboardingService.updateStep(step);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update step"
      );
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  "auth/completeOnboarding",
  async (_, { rejectWithValue }) => {
    try {
      const data = await onboardingService.complete();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete onboarding"
      );
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // GetMe
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Save Preferences
      .addCase(savePreferences.fulfilled, (state, action) => {
        if (state.user) {
          state.user.analyzerPreference = action.payload.analyzerPreference;
          state.user.onboardingStep = action.payload.onboardingStep;
        }
      })
      // Update Step
      .addCase(updateStep.fulfilled, (state, action) => {
        if (state.user) {
          state.user.onboardingStep = action.payload.onboardingStep;
        }
      })
      // Complete Onboarding
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        if (state.user) {
          state.user.onboardingCompleted = action.payload.onboardingCompleted;
          state.user.onboardingStep = 3;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
