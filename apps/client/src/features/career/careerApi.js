import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const careerApi = createApi({
  reducerPath: 'careerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/career-matches',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCareerMatches: builder.query({
      query: () => '/',
    }),
  }),
});

export const { useGetCareerMatchesQuery } = careerApi;
