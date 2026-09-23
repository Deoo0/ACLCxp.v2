import axios from "axios";

const origin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const timeout = Number.isFinite(configuredTimeout) && configuredTimeout >= 1000
  ? Math.min(configuredTimeout, 120000)
  : 20000;
const api = axios.create({
  baseURL: `${origin}/api`,
  timeout,
  headers: { "Content-Type": "application/json" },
});
let refresh: Promise<string> | null = null;
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const publicAuth =
    config.url?.startsWith("/auth/") &&
    !["/auth/me/", "/auth/logout/"].includes(config.url);
  if (token && !publicAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => {
    // Some serializers have no request context and return relative upload URLs.
    // Resolve them against the API host, including when the frontend is hosted separately.
    const resolveImages = (value: unknown): void => {
      if (!value || typeof value !== "object" || value instanceof Blob) return;
      for (const [key, item] of Object.entries(value)) {
        if (["photo", "banner_image", "poster_image", "logo_url", "profile_photo"].includes(key) && typeof item === "string" && item.startsWith("/media/")) {
          (value as Record<string, unknown>)[key] = new URL(item, origin || window.location.origin).href;
        } else if (item && typeof item === "object") resolveImages(item);
      }
    };
    resolveImages(response.data);
    return response;
  },
  async (error) => {
    const config = error.config;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      ["/auth/login/", "/auth/token/refresh/"].includes(config.url)
    )
      return Promise.reject(error);
    const token = localStorage.getItem("refresh_token");
    if (!token) return Promise.reject(error);
    config._retried = true;
    try {
      refresh ??= axios
        .post(
          `${origin}/api/auth/token/refresh/`,
          { refresh: token },
          { timeout },
        )
        .then(({ data }) => {
          const access: string = data.data.access;
          if (localStorage.getItem("refresh_token") !== token)
            throw new Error("Session changed");
          localStorage.setItem("access_token", access);
          if (data.data.refresh)
            localStorage.setItem("refresh_token", data.data.refresh);
          return access;
        })
        .finally(() => {
          refresh = null;
        });
      const access = await refresh;
      config.headers.Authorization = `Bearer ${access}`;
      return api(config);
    } catch {
      if (localStorage.getItem("refresh_token") === token) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event("auth:expired"));
      }
      return Promise.reject(error);
    }
  },
);
export default api;
