import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const coverLetterApi = createApi({
  reducerPath: 'coverLetterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/cover-letter',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    generateCoverLetter: builder.mutation({
      query: (body) => ({
        url: '/generate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateCoverLetterMutation } = coverLetterApi;
