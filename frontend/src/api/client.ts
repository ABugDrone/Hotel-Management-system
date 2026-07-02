/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import axios from "axios";


const client = axios.create({
  timeout: 15000,
});

// Update baseURL dynamically after config is loaded
export const initApiClient = (baseURL: string) => {
  client.defaults.baseURL = baseURL;
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("amirable_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("amirable_token");
      localStorage.removeItem("amirable_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
