"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Upload } from "lucide-react";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  // Estados para os dados do perfil (note que o endpoint atualiza name, bio e password)
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  // Estado para o avatar é utilizado apenas para atualização visual
  const [avatar, setAvatar] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se o usuário não estiver autenticado, redireciona para o login;
  // caso contrário, preenche os estados com os dados atuais
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile");
    } else {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
    }
  }, [router, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Cria o payload removendo os itens não informados
      const payload = {};
      if (name) payload.name = name;
      if (bio) payload.bio = bio;
      if (password) payload.password = password;

      // Faz a requisição PATCH conforme o curl informado
      const response = await api.patch("/users/me", payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Atualiza o perfil no auth context, se disponível
      if (updateProfile) {
        updateProfile(response.data);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para lidar com o upload do avatar (atualiza apenas a visualização local)
  const handleAvatarChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Seu Perfil</CardTitle>
            <CardDescription>
              Visualize e edite suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="p-3 text-sm text-white bg-green-500 rounded-md">
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatar || "/placeholder.svg?height=96&width=96"}
                    alt={name}
                  />
                  <AvatarFallback>
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("avatar")?.click()}
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar foto
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fale sobre você..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha (opcional)"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
