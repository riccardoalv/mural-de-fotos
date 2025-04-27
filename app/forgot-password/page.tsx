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
import { AlertCircle, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Por favor, informe seu email.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chamar a API para solicitar recuperação de senha
      await api.post("/users/recover-password", { email });

      // Mostrar mensagem de sucesso
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Erro ao solicitar recuperação de senha:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(
          "Não foi possível processar sua solicitação. Tente novamente mais tarde.",
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
              <CardTitle>Recuperação de Senha</CardTitle>
            </div>
            <CardDescription>
              Informe seu email para receber um código de recuperação de senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Código enviado com sucesso!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Enviamos um código de 6 dígitos para o seu email. Use este
                    código na página de redefinição de senha para criar uma nova
                    senha. Se não encontrar o email, verifique também sua pasta
                    de spam.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/reset-password")}
                  >
                    Ir para redefinição de senha
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar código de recuperação
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Lembrou sua senha?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Voltar para o login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
