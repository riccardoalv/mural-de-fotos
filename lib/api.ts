"use client";

import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    Accept: "*/*",
    // "Content-Type": "application/json",
  },
});

export default api;

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
};

export const uploadImage = async (
  file: File,
  folder?: string,
): Promise<string> => {
  const token = getAuthToken();

  const formData = new FormData();
  formData.append("image", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const config: AxiosRequestConfig = {
    headers: {},
  };

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await api.post<{ key: string; url: string }>(
    "/upload",
    formData,
    config,
  );

  return response.data.url;
};

export const searchPosts = async <T = unknown>(
  term: string,
  page = 1,
  limit = 24,
): Promise<T> => {
  const token = getAuthToken();

  const config: AxiosRequestConfig = {
    params: { term, page, limit },
  };

  if (token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }

  const response = await api.get<T>("/posts/search", config);
  return response.data;
};
