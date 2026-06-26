import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi.js';
import { resumeApi } from '../features/resume/resumeApi.js';
import { chatApi } from '../features/chat/chatApi.js';
import { careerApi } from '../features/career/careerApi.js';
import { roadmapApi } from '../features/roadmap/roadmapApi.js';
import authReducer from '../features/auth/authSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [resumeApi.reducerPath]: resumeApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [careerApi.reducerPath]: careerApi.reducer,
    [roadmapApi.reducerPath]: roadmapApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, resumeApi.middleware, chatApi.middleware, careerApi.middleware, roadmapApi.middleware),
});
