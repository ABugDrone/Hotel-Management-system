/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

export interface AppConfig {
  api_base_url: string;
  app_version: string;
  developer: string;
}

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;
  
  try {
    // In dev, config.json is in public folder or root. 
    // In production, it's served by the backend or in the dist folder.
    const res = await fetch("/config.json");
    if (!res.ok) {
      // Try fallback path for Tauri/desktop
      const fallbackRes = await fetch("http://localhost:8000/config.json");
      if (!fallbackRes.ok) throw new Error("Failed to load config.json");
      cachedConfig = await fallbackRes.json();
    } else {
      cachedConfig = await res.json();
    }
    return cachedConfig!;
  } catch (err) {
    console.error("Config error:", err);
    return {
      api_base_url: "http://localhost:8000",
      app_version: "1.0.0-fallback",
      developer: "DroneBug Technologies"
    };
  }
}

export const getApiBaseUrl = () => cachedConfig?.api_base_url || "http://localhost:8000";
