import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const linkedInOptimizerApi = createApi({
  reducerPath: 'linkedInOptimizerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/linkedin-optimizer',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    optimizeProfile: builder.mutation({
      query: () => ({
        url: '/optimize',
        method: 'POST',
      }),
    }),
  }),
});

export const { useOptimizeProfileMutation } = linkedInOptimizerApi;
