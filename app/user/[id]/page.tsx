"use client";

import { useState, useEffect, useMemo } from "react";
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
import api from "@/lib/api";
import PhotoGrid from "@/components/photo-grid";

interface Post {
  id: string;
  caption?: string | null;
  imageUrl?: string | null;
  isVideo?: boolean;
}

interface CommentWithPost {
  id: string;
  content: string;
  createdAt: string;
  post: Post;
}

interface UserProfile {
  id: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  likes?: { post: Post }[];
  comments?: CommentWithPost[];
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function UserStats({
  postsCount,
  likesCount,
  commentsCount,
}: {
  postsCount: number;
  likesCount: number;
  commentsCount: number;
}) {
  return (
    <div className="flex gap-4 mt-4 justify-center">
      <div className="text-sm">
        <span className="font-bold">{postsCount}</span> publicações
      </div>
      <div className="text-sm">
        <span className="font-bold">{likesCount}</span> curtidas
      </div>
      <div className="text-sm">
        <span className="font-bold">{commentsCount}</span> comentários
      </div>
    </div>
  );
}

function PostsTab({
  userName,
  userId,
  posts,
  isLoading,
}: {
  userName: string;
  userId: string;
  posts: Post[];
  isLoading: boolean;
}) {
  return (
    <TabsContent value="posts">
      <Card>
        <CardHeader>
          <CardTitle>Publicações de {userName}</CardTitle>
          <CardDescription>Fotos publicadas por este usuário</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Este usuário ainda não publicou nenhuma foto
              </p>
            </div>
          ) : (
            <PhotoGrid filters={{ userId }} useDirectLinks />
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function LikesTab({
  userName,
  likedPosts,
  isLoading,
}: {
  userName: string;
  likedPosts: Post[];
  isLoading: boolean;
}) {
  return (
    <TabsContent value="likes">
      <Card>
        <CardHeader>
          <CardTitle>Fotos curtidas por {userName}</CardTitle>
          <CardDescription>
            Fotos que este usuário curtiu no mural
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : likedPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Este usuário ainda não curtiu nenhuma foto
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
              {likedPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden rounded-md bg-muted"
                >
                  {post.isVideo ? (
                    <video
                      src={post.imageUrl ?? ""}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={post.imageUrl ?? "/placeholder.svg"}
                      alt={post.caption ?? "Imagem curtida"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function CommentsTab({
  userName,
  comments,
  isLoading,
}: {
  userName: string;
  comments: CommentWithPost[];
  isLoading: boolean;
}) {
  return (
    <TabsContent value="comments">
      <Card>
        <CardHeader>
          <CardTitle>Comentários de {userName}</CardTitle>
          <CardDescription>
            Comentários feitos por este usuário no mural
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Este usuário ainda não fez nenhum comentário
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {comment.post.isVideo ? (
                        <video
                          src={comment.post.imageUrl ?? ""}
                          className="object-cover w-full h-full rounded-md"
                          controls
                        />
                      ) : (
                        <img
                          src={comment.post.imageUrl ?? "/placeholder.svg"}
                          alt={comment.post.caption ?? "Foto comentada"}
                          className="object-cover w-full h-full rounded-md"
                        />
                      )}
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
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<CommentWithPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const response = await api.get<UserProfile>(`/users/${userId}`, {
          headers,
        });

        const userData = response.data;
        setUser(userData);

        if (userData.likes) {
          setLikedPosts(userData.likes.map((i) => i.post));
          setIsLoadingLikes(false);
        } else {
          fetchUserLikes();
        }

        if (userData.comments) {
          setUserComments(userData.comments);
          setIsLoadingComments(false);
        } else {
          fetchUserComments();
        }

        fetchUserPosts();
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setError("Não foi possível carregar os dados do usuário");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const token = localStorage.getItem("token");
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const response = await api.get<{ data: Post[] }>(
          `/posts?userId=${userId}`,
          { headers },
        );

        setUserPosts(response.data.data || []);
      } catch (err) {
        console.error("Erro ao buscar posts do usuário:", err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    const fetchUserLikes = async () => {
      setIsLoadingLikes(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoadingLikes(false);
          return;
        }

        const response = await api.get<{ data: Post[] }>(
          `/users/${userId}/likes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setLikedPosts(response.data.data || []);
      } catch (err) {
        console.error("Erro ao buscar likes do usuário:", err);
      } finally {
        setIsLoadingLikes(false);
      }
    };

    const fetchUserComments = async () => {
      setIsLoadingComments(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoadingComments(false);
          return;
        }

        const response = await api.get<{ data: CommentWithPost[] }>(
          `/users/${userId}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setUserComments(response.data.data || []);
      } catch (err) {
        console.error("Erro ao buscar comentários do usuário:", err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const stats = useMemo(
    () => ({
      posts: userPosts.length,
      likes: likedPosts.length,
      comments: userComments.length,
    }),
    [userPosts.length, likedPosts.length, userComments.length],
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center">
          <LoadingSpinner />
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
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.avatarUrl || "/placeholder.svg?height=96&width=96"}
              alt={user.name ?? ""}
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.bio && (
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                {user.bio}
              </p>
            )}
            <UserStats
              postsCount={stats.posts}
              likesCount={stats.likes}
              commentsCount={stats.comments}
            />
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

          <PostsTab
            userName={user.name ?? "Usuário"}
            userId={user.id}
            posts={userPosts}
            isLoading={isLoadingPosts}
          />

          <LikesTab
            userName={user.name ?? "Usuário"}
            likedPosts={likedPosts}
            isLoading={isLoadingLikes}
          />

          <CommentsTab
            userName={user.name ?? "Usuário"}
            comments={userComments}
            isLoading={isLoadingComments}
          />
        </Tabs>
      </main>
    </>
  );
}
