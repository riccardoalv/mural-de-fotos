"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AlertCircle, Key, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!email.trim()) {
      setError("Por favor, informe seu email.");
      return;
    }

    if (!code.trim() || code.length !== 6) {
      setError("O código de recuperação deve ter 6 dígitos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chamar a API para redefinir a senha
      await api.post("/users/reset-password", {
        email,
        code,
        newPassword,
      });

      // Mostrar mensagem de sucesso
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(
          "Não foi possível redefinir sua senha. Verifique os dados informados e tente novamente.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button variant="ghost" asChild className="p-0 mr-2">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle>Redefinir Senha</CardTitle>
            </div>
            <CardDescription>
              Digite o código de 6 dígitos recebido por email e crie uma nova
              senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Senha redefinida com sucesso!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Sua senha foi atualizada. Agora você pode fazer login com
                    sua nova senha.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/login")}
                  >
                    Ir para o login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-white bg-red-500 rounded-md flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código de Recuperação</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      // Permitir apenas números e limitar a 6 dígitos
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setCode(value);
                    }}
                    placeholder="Digite o código de 6 dígitos"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o código de 6 dígitos enviado para seu email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Redefinindo..."
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Redefinir Senha
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?{" "}
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Solicitar novo código
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
