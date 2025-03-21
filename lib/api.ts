// lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://computacao.unir.br/mural/api",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});

export default api;
