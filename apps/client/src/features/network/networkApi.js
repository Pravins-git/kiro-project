import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const networkApi = createApi({
  reducerPath: 'networkApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/network',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getNetworkRecommendations: builder.query({
      query: (role) => `/recommendations?role=${encodeURIComponent(role)}`,
    }),
  }),
});

export const { useGetNetworkRecommendationsQuery, useLazyGetNetworkRecommendationsQuery } = networkApi;
