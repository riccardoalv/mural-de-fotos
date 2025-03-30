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
import api, { getImageUrl } from "@/lib/api";
import PhotoGrid from "@/components/photo-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FilterOptions } from "@/components/filters";
import { uploadImage } from "@/lib/image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "posts" | "likes" | "comments"
  >("profile");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
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
  const [likedPosts, setLikedPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters: FilterOptions = {
    order: "desc",
    orderBy: "createdAt",
    userId: user?.id,
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const fetchUserExtras = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/users/${user!.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        console.log(data)
        setLikedPosts(data.likes?.flatMap((it) => it.post) || []);
        setUserComments(data.comments || []);
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      } finally {
        setIsLoadingLikes(false);
        setIsLoadingComments(false);
      }
    };

    if (!user) {
      router.push("/login?redirect=/profile");
    } else {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
      setOriginalData({
        name: user.name || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });

      fetchUserExtras();
    }
  }, [user]);

  useEffect(() => {
    const hasChanged =
      name !== originalData.name ||
      bio !== originalData.bio ||
      avatarUrl !== originalData.avatarUrl ||
      password.length > 0;
    setHasChanges(hasChanged);
  }, [name, bio, avatarUrl, password, originalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return setError("Faça pelo menos uma alteração.");
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const updateData: any = {};
      if (name !== originalData.name) updateData.name = name;
      if (bio !== originalData.bio) updateData.bio = bio;
      if (password) updateData.password = password;
      if (avatarUrl !== originalData.avatarUrl)
        updateData.avatarUrl = avatarUrl;

      const response = await api.patch("/users/me", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateProfile?.(response.data);
      setOriginalData({ name, bio, avatarUrl });
      setPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erro ao atualizar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string" && setAvatarUrl(reader.result);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setAvatarUrl(imageUrl);
    } catch (err) {
      setError("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs
          defaultValue="profile"
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="profile" className="px-6">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="posts">Meus Posts</TabsTrigger>
              <TabsTrigger value="likes">Curtidas</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>
          </div>

          {/* Perfil */}
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

          {/* Meus Posts */}
          <TabsContent value="posts">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Grid className="h-5 w-5 mr-2" /> Meus Posts
            </h2>
            <PhotoGrid filters={filters} />
          </TabsContent>

          {/* Curtidas */}
          <TabsContent value="likes">
            <Card>
              <CardHeader>
                <CardTitle>Fotos que você curtiu</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingLikes ? (
                  <div className="flex justify-center py-8 animate-spin border-b-2 border-primary h-8 w-8 rounded-full" />
                ) : likedPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Você ainda não curtiu nenhuma foto.
                  </p>
                ) : (
                  <PhotoGrid
                    filters={{ userId: user.id }}
                    useDirectLinks={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comentários */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Seus comentários</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingComments ? (
                  <div className="flex justify-center py-8 animate-spin border-b-2 border-primary h-8 w-8 rounded-full" />
                ) : userComments.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Você ainda não comentou nenhuma foto.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userComments.map((comment: any) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex gap-3 items-start">
                          <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                            {comment.post.isVideo ? (
                              <video
                                src={getImageUrl(comment.post.id)}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <img
                                src={getImageUrl(comment.post.id)}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {comment.post.caption || "Sem título"}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Comentário:{" "}
                              <span className="text-foreground">
                                {comment.content}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
