"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Cria o contexto de autenticação
const AuthContext = createContext(null);

// Provider que envolverá a aplicação para disponibilizar os dados de autenticação
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Ao montar, verifica se há informações do usuário salvas no localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Função para atualizar o estado com os dados do usuário após o login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Função para realizar logout e limpar os dados armazenados
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
