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

export default client;
