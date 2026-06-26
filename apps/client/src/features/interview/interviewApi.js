import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const interviewApi = createApi({
  reducerPath: 'interviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/interview',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    startSession: builder.mutation({
      query: (body) => ({
        url: '/start',
        method: 'POST',
        body,
      }),
    }),
    sendMessage: builder.mutation({
      query: ({ sessionId, message }) => ({
        url: `/${sessionId}/message`,
        method: 'POST',
        body: { message },
      }),
    }),
  }),
});

export const { useStartSessionMutation, useSendMessageMutation } = interviewApi;
