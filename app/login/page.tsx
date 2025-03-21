"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useIsClient } from "@/hooks/use-is-client";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const isClient = useIsClient();

  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isClient && user && !loading) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath, isClient, loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Fazer a chamada API de login diretamente
      const { data } = await api.post("/auths/login", {
        identifier: email,
        password,
      });

      if (data.accessToken) {
        // Passar o token para o contexto
        login(data.accessToken);
        router.push(redirectPath);
      } else {
        setError("Credenciais inválidas");
      }
    } catch (err: any) {
      const apiError =
        err?.response?.data?.message || "Email ou senha incorretos.";
      setError(apiError);
      console.error("Erro de login:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar um indicador de carregamento enquanto verificamos a autenticação
  if (loading && isClient) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com sua conta para acessar o mural de fotos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 text-sm text-white bg-red-500 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  aria-invalid={!!error}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="#"
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  aria-invalid={!!error}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
