import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const coldEmailApi = createApi({
  reducerPath: 'coldEmailApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/cold-email',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    generateSequence: builder.mutation({
      query: (body) => ({
        url: '/generate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateSequenceMutation } = coldEmailApi;
