import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const offerComparisonApi = createApi({
  reducerPath: 'offerComparisonApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/offer-comparison',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    compareOffers: builder.mutation({
      query: (body) => ({
        url: '/compare',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useCompareOffersMutation } = offerComparisonApi;
