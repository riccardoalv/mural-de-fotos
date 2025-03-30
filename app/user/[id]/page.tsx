"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, ImageIcon } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/api";
import api from "@/lib/api";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // Buscar dados do usuário
        const response = await api.get(`/users/${userId}`, {
          headers,
        });

        setUser(response.data);

        // Extrair likes e comentários da resposta do usuário
        if (response.data.likes) {
          setLikedPosts(response.data.likes.flatMap((i) => i.post) || []);
          setIsLoadingLikes(false);
        } else {
          fetchUserLikes();
        }

        if (response.data.comments) {
          setUserComments(response.data.comments || []);
          setIsLoadingComments(false);
        } else {
          fetchUserComments();
        }

        // Buscar posts do usuário
        fetchUserPosts();
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setError("Não foi possível carregar os dados do usuário");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Buscar posts do usuário
  const fetchUserPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await api.get(`/posts?userId=${userId}`, {
        headers,
      });

      setUserPosts(response.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar posts do usuário:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Buscar likes do usuário (método alternativo)
  const fetchUserLikes = async () => {
    setIsLoadingLikes(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingLikes(false);
        return;
      }

      const response = await api.get(`/users/${userId}/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLikedPosts(response.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar likes do usuário:", error);
    } finally {
      setIsLoadingLikes(false);
    }
  };

  // Buscar comentários do usuário (método alternativo)
  const fetchUserComments = async () => {
    setIsLoadingComments(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingComments(false);
        return;
      }

      const response = await api.get(`/users/${userId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserComments(response.data.data || []);
    } catch (error) {
      console.error("Erro ao buscar comentários do usuário:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-500">
                  {error || "Usuário não encontrado"}
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.avatarUrl || "/placeholder.svg?height=96&width=96"}
              alt={user.name}
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.bio && (
              <p className="text-muted-foreground mt-2">{user.bio}</p>
            )}
            <div className="flex gap-4 mt-4">
              <div className="text-sm">
                <span className="font-bold">{userPosts.length}</span>{" "}
                publicações
              </div>
              <div className="text-sm">
                <span className="font-bold">{likedPosts.length}</span> curtidas
              </div>
              <div className="text-sm">
                <span className="font-bold">{userComments.length}</span>{" "}
                comentários
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="posts">
              <ImageIcon className="h-4 w-4 mr-2" />
              Publicações
            </TabsTrigger>
            <TabsTrigger value="likes">
              <Heart className="h-4 w-4 mr-2" />
              Curtidas
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageCircle className="h-4 w-4 mr-2" />
              Comentários
            </TabsTrigger>
          </TabsList>

          {/* Aba de Publicações */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Publicações de {user.name}</CardTitle>
                <CardDescription>
                  Fotos publicadas por este usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Este usuário ainda não publicou nenhuma foto
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {userPosts.map((post) => (
                      <div
                        key={post.id}
                        className="relative aspect-square rounded-md overflow-hidden group"
                      >
                        <Image
                          src={getImageUrl(post.id) || "/placeholder.svg"}
                          alt={post.caption || "Foto publicada"}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="text-white text-sm font-medium">
                            {post.caption}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Curtidas */}
          <TabsContent value="likes">
            <Card>
              <CardHeader>
                <CardTitle>Fotos curtidas por {user.name}</CardTitle>
                <CardDescription>
                  Fotos que este usuário curtiu no mural
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLikes ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : likedPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Este usuário ainda não curtiu nenhuma foto
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {likedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="relative aspect-square rounded-md overflow-hidden group"
                      >
                        <Image
                          src={getImageUrl(post.id) || "/placeholder.svg"}
                          alt={post.caption || "Foto curtida"}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="text-white text-sm font-medium">
                            {post.caption}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Comentários */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comentários de {user.name}</CardTitle>
                <CardDescription>
                  Comentários feitos por este usuário no mural
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingComments ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : userComments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Este usuário ainda não fez nenhum comentário
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden">
                            <Image
                              src={
                                getImageUrl(comment.post.id) ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={comment.post.caption || "Foto comentada"}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {comment.post.caption || "Sem título"}
                            </div>
                            <p className="text-sm mt-1 text-muted-foreground">
                              Comentário:{" "}
                              <span className="text-foreground">
                                {comment.content}
                              </span>
                            </p>
                            <p className="text-xs mt-1 text-muted-foreground">
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
