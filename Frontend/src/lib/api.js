import axios from 'axios';

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:3000' : browserOrigin);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function getErrorMessage(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export {
  api,
  API_BASE_URL,
  SOCKET_URL,
  getErrorMessage,
};
