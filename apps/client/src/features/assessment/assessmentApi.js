import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const assessmentApi = createApi({
  reducerPath: 'assessmentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/assessment',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    generateQuestion: builder.mutation({
      query: (body) => ({
        url: '/generate',
        method: 'POST',
        body,
      }),
    }),
    evaluateAnswer: builder.mutation({
      query: (body) => ({
        url: '/evaluate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateQuestionMutation, useEvaluateAnswerMutation } = assessmentApi;
