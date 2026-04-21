import axios from "axios";

import { getBrowserApiBaseUrl } from "@/src/lib/api/client-base-url";

/**
 * Shared Axios instance for client-side reads against App Router API routes.
 * Uses session cookies (same-origin); do not use for third-party APIs.
 */
export const apiAxios = axios.create({
  baseURL: getBrowserApiBaseUrl(),
  headers: { Accept: "application/json" },
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 300,
});
