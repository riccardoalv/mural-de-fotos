"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Função para persistir o usuário no localStorage
const saveUserToStorage = (user: User | null) => {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
    }
  }
}

// Função para recuperar o usuário do localStorage
const getUserFromStorage = (): User | null => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch (e) {
        return null
      }
    }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const storedUser = getUserFromStorage()
    if (storedUser) {
      setUser(storedUser)
    }
  }, [])

  // Função de login
  const login = async (email: string, password: string) => {
    // Simulação de autenticação - em um app real, isso seria uma chamada API
    if (email && password.length >= 6) {
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        name: email.split("@")[0],
        email: email,
      }
      setUser(newUser)
      saveUserToStorage(newUser)
      return true
    }
    return false
  }

  // Função de registro
  const register = async (name: string, email: string, password: string) => {
    // Simulação de registro - em um app real, isso seria uma chamada API
    if (name && email && password.length >= 6) {
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
      }
      setUser(newUser)
      saveUserToStorage(newUser)
      return true
    }
    return false
  }

  // Função de logout
  const logout = () => {
    setUser(null)
    saveUserToStorage(null)
  }

  // Função para atualizar o perfil
  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      saveUserToStorage(updatedUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

