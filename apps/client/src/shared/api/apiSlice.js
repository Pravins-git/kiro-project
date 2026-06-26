import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1',
    prepareHeaders: (headers) => {
      // Future: add auth token here
      return headers;
    },
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
