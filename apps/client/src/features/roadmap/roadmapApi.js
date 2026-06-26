import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const roadmapApi = createApi({
  reducerPath: 'roadmapApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4000/api/v1/roadmaps',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    generateRoadmap: builder.mutation({
      query: (body) => ({
        url: '/generate',
        method: 'POST',
        body,
      }),
    }),
    getRoadmap: builder.query({
      query: (careerId) => `/${careerId}`,
    }),
  }),
});

export const { useGenerateRoadmapMutation, useGetRoadmapQuery } = roadmapApi;
