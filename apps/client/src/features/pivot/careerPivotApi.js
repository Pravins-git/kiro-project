import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const careerPivotApi = createApi({
  reducerPath: 'careerPivotApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/career-pivot',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    analyzePivot: builder.mutation({
      query: (body) => ({
        url: '/analyze',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useAnalyzePivotMutation } = careerPivotApi;
