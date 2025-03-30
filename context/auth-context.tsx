"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

// Atualizar a interface User para usar avatarUrl
interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

interface JwtPayload {
  email: string;
  sub: string; // user ID
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  updateProfile?: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para extrair informações do token
  const getUserFromToken = (token: string): User | null => {
    try {
      console.log("Decodificando token:", token.substring(0, 15) + "...");
      const decoded = jwtDecode<JwtPayload>(token);
      console.log("Token decodificado:", {
        email: decoded.email,
        id: decoded.sub,
      });
      return {
        id: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  };

  // Verificar token ao inicializar
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar se estamos no cliente
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        console.log("Token encontrado:", token ? "Sim" : "Não");

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Extrair informações do usuário do token
        const userData = getUserFromToken(token);

        if (userData) {
          setUser(userData);
        } else {
          // Token inválido
          console.log("Token inválido, removendo...");
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (e) {
        console.error("Erro ao verificar autenticação:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login apenas armazena o token e extrai informações
  const login = (token: string) => {
    if (typeof window !== "undefined") {
      console.log("Salvando token:", token.substring(0, 15) + "...");
      localStorage.setItem("token", token);
      const userData = getUserFromToken(token);
      setUser(userData);
    }
  };

  // Logout remove o token
  const logout = () => {
    if (typeof window !== "undefined") {
      console.log("Removendo token e fazendo logout");
      localStorage.removeItem("token");
    }
    setUser(null);
  };

  // Atualizar a função updateProfile para garantir que avatarUrl seja tratado corretamente
  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      // Garantir que avatarUrl seja preservado se estiver presente nos dados atualizados
      const updatedUser = { ...user, ...userData };
      console.log("Perfil atualizado:", updatedUser);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
