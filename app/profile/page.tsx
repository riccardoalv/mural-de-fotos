"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
import { Save, Upload, Grid, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import PhotoGrid from "@/components/photo-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FilterOptions } from "@/components/filters";
import { uploadImage } from "@/lib/image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "posts">("profile");

  // Estados para os dados do perfil
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  // Alterar os estados para usar avatarUrl em vez de avatar
  const [avatarUrl, setAvatarUrl] = useState("");
  const [originalData, setOriginalData] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtros para mostrar apenas os posts do usuário atual
  const filters: FilterOptions = {
    order: "desc",
    orderBy: "createdAt",
    userId: user?.id,
  };

  // Se o usuário não estiver autenticado, redireciona para o login;
  // caso contrário, preenche os estados com os dados atuais
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile");
    } else {
      setName(user.name || "");
      setBio(user.bio || "");
      // Alterar os estados para usar avatarUrl em vez de avatar
      setAvatarUrl(user.avatarUrl || "");
      setOriginalData({
        name: user.name || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [router, user]);

  // Verificar se houve alterações nos campos
  useEffect(() => {
    const hasNameChanged = name !== originalData.name;
    const hasBioChanged = bio !== originalData.bio;
    const hasAvatarChanged = avatarUrl !== originalData.avatarUrl;
    const hasPasswordChanged = password.length > 0;

    setHasChanges(
      hasNameChanged || hasBioChanged || hasAvatarChanged || hasPasswordChanged,
    );
  }, [name, bio, avatarUrl, password, originalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se houve alguma alteração
    if (!hasChanges) {
      setError("Faça pelo menos uma alteração antes de salvar.");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Preparar dados para atualização
      const updateData: any = {};

      if (name !== originalData.name) updateData.name = name;
      if (bio !== originalData.bio) updateData.bio = bio;
      if (password) updateData.password = password;
      if (avatarUrl !== originalData.avatarUrl)
        updateData.avatarUrl = avatarUrl;

      const response = await api.patch("/users/me", updateData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Atualiza o perfil no contexto, se disponível
      if (updateProfile) {
        updateProfile(response.data);
      }

      // Atualizar os dados originais após salvar com sucesso
      setOriginalData({
        name,
        bio,
        avatarUrl,
      });

      // Limpar senha após salvar
      setPassword("");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      setError(
        error?.response?.data?.message ||
        "Erro ao atualizar perfil. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para lidar com o upload do avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Mostrar preview local temporário
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result); // Temporário para preview
      }
    };
    reader.readAsDataURL(file);

    // Iniciar upload para serviço externo
    setIsUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(file);
      setAvatarUrl(imageUrl); // Definir a URL real após o upload
      console.log("Imagem enviada com sucesso:", imageUrl);
    } catch (err: any) {
      console.error("Erro ao fazer upload da imagem:", err);
      setError("Falha ao fazer upload da imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs
          defaultValue="profile"
          onValueChange={(value) => setActiveTab(value as "profile" | "posts")}
        >
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="profile" className="px-6">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="posts" className="px-6">
                Meus Posts
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="flex justify-center">
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
                    <Alert className="bg-green-500 text-white">
                      <AlertDescription>
                        Perfil atualizado com sucesso!
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col items-center space-y-4">
                    {/* Atualizar o componente Avatar para usar avatarUrl */}
                    <Avatar className="h-24 w-24 relative">
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <AvatarImage
                        src={avatarUrl || "/placeholder.svg?height=96&width=96"}
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
                        ref={fileInputRef}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSelectImage}
                        size="sm"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Enviando..." : "Alterar foto"}
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || isUploading || !hasChanges}
                  >
                    {isSubmitting ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>

                  {!hasChanges && (
                    <p className="text-xs text-muted-foreground text-center">
                      Faça pelo menos uma alteração para salvar.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <div className="mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Grid className="h-5 w-5 mr-2" />
                Meus Posts
              </h2>
              <p className="text-muted-foreground mt-1">
                Visualize e gerencie todos os seus posts
              </p>
            </div>

            <PhotoGrid filters={filters} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
