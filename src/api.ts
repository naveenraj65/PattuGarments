import axios from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true });

export const apiError = (e: any): string =>
  e?.response?.data?.message || e?.message || 'Something went wrong';
