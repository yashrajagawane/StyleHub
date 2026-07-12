import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stylehub_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      localStorage.removeItem("stylehub_token");
      localStorage.removeItem("stylehub_user");
      if (!window.location.pathname.endsWith("/login")) window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Convenience wrappers
export const publicApi = {
  listProducts: (params) => api.get("/products", { params }).then((r) => r.data),
  getProduct: (idOrSlug) => api.get(`/products/${idOrSlug}`).then((r) => r.data),
  related: (id) => api.get(`/products/${id}/related`).then((r) => r.data),
  categories: (params = {}) => api.get("/categories", { params }).then((r) => r.data),
  brands: (params = {}) => api.get("/brands", { params }).then((r) => r.data),
  offers: (params = {}) => api.get("/offers", { params }).then((r) => r.data),
  gallery: (params = {}) => api.get("/gallery", { params }).then((r) => r.data),
  banners: (params = {}) => api.get("/banners", { params }).then((r) => r.data),
  testimonials: (params = {}) => api.get("/testimonials", { params }).then((r) => r.data),
  settings: () => api.get("/settings").then((r) => r.data),
  contact: (data) => api.post("/inquiries", data).then((r) => r.data),
  subscribe: (email) => api.post("/newsletter", { email }).then((r) => r.data),
};
