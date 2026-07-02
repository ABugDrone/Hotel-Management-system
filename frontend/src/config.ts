export interface AppConfig {
  api_base_url: string;
  app_version: string;
  developer: string;
}

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch("/config.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cachedConfig = data;
    return data;
  } catch {
    // Dev fallback: auto-detect backend on port 8000
    const hostname = window.location.hostname;
    cachedConfig = {
      api_base_url: `http://${hostname}:8000`,
      app_version: "1.0.0-dev",
      developer: "DroneBug Technologies"
    };
    return cachedConfig;
  }
}
