import { configureStore } from '@reduxjs/toolkit';

import { apiSlice } from '../shared/api/apiSlice';
import { authApi } from '../features/auth/authApi';
import authReducer from '../features/auth/authSlice';
import { profileApi } from '../features/profile/profileApi';
import { resumeApi } from '../features/resume/resumeApi';
import { careerApi } from '../features/career/careerApi';
import { adminApi } from '../features/admin/adminApi';
import { marketApi } from '../features/market/marketApi';
import { interviewApi } from '../features/interview/interviewApi';
import { coverLetterApi } from '../features/cover-letter/coverLetterApi';
import { networkApi } from '../features/network/networkApi';
import { assessmentApi } from '../features/assessment/assessmentApi';
import { negotiationApi } from '../features/negotiation/negotiationApi';
import { careerPivotApi } from '../features/pivot/careerPivotApi';
import { linkedInOptimizerApi } from '../features/linkedin/linkedInOptimizerApi';
import { coldEmailApi } from '../features/email/coldEmailApi';
import { offerComparisonApi } from '../features/offer/offerComparisonApi';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [resumeApi.reducerPath]: resumeApi.reducer,
    [careerApi.reducerPath]: careerApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [marketApi.reducerPath]: marketApi.reducer,
    [interviewApi.reducerPath]: interviewApi.reducer,
    [coverLetterApi.reducerPath]: coverLetterApi.reducer,
    [networkApi.reducerPath]: networkApi.reducer,
    [assessmentApi.reducerPath]: assessmentApi.reducer,
    [negotiationApi.reducerPath]: negotiationApi.reducer,
    [careerPivotApi.reducerPath]: careerPivotApi.reducer,
    [linkedInOptimizerApi.reducerPath]: linkedInOptimizerApi.reducer,
    [coldEmailApi.reducerPath]: coldEmailApi.reducer,
    [offerComparisonApi.reducerPath]: offerComparisonApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware, 
      authApi.middleware, 
      profileApi.middleware,
      resumeApi.middleware,
      careerApi.middleware,
      adminApi.middleware,
      marketApi.middleware,
      interviewApi.middleware,
      coverLetterApi.middleware,
      networkApi.middleware,
      assessmentApi.middleware,
      negotiationApi.middleware,
      careerPivotApi.middleware,
      linkedInOptimizerApi.middleware,
      coldEmailApi.middleware,
      offerComparisonApi.middleware
    ),
  devTools: import.meta.env.DEV,
});
