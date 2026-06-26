import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const marketApi = createApi({
  reducerPath: 'marketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/market',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getInsights: builder.query({
      query: (role) => `/insights?role=${encodeURIComponent(role)}`,
    }),
  }),
});

export const { useGetInsightsQuery, useLazyGetInsightsQuery } = marketApi;
