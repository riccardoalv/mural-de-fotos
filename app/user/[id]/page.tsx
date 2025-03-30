"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Mail,
  UserIcon,
  Heart,
  MessageCircle,
  Image,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import PhotoGrid from "@/components/photo-grid";
import type { FilterOptions } from "@/components/filters";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros para mostrar apenas os posts do usuário
  const filters: FilterOptions = {
    order: "desc",
    orderBy: "createdAt",
    userId: id as string,
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const config = token
          ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
          : undefined;

        const response = await api.get(`/users/${id}`, config);
        setUser(response.data);
      } catch (err: any) {
        console.error("Erro ao buscar perfil do usuário:", err);
        setError(
          err?.response?.data?.message ||
          "Não foi possível carregar o perfil do usuário",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Voltar para o início
            </Button>
          </div>
        ) : user ? (
          <>
            <div className="flex flex-col items-center text-center mb-8 space-y-4">
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
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    {user.bio}
                  </p>
                )}

                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Heart className="h-5 w-5 text-primary" />
                      <p className="text-2xl font-bold">
                        {user.totalLikes || 0}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <p className="text-2xl font-bold">
                        {user.totalComments || 0}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Comentários</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Image className="h-5 w-5 text-primary" />
                      <p className="text-2xl font-bold">
                        {user.totalPosts || 0}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{user.email}</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      Membro desde{" "}
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile")}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Editar perfil
                </Button>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Posts de {user.name}
              </h2>
            </div>

            <UserPhotoGrid filters={filters} />
          </>
        ) : (
          <div className="text-center py-8">
            <p>Usuário não encontrado</p>
          </div>
        )}
      </main>
    </>
  );
}

// Componente específico para o perfil do usuário que usa links diretos
function UserPhotoGrid({ filters }: { filters: FilterOptions }) {
  return <PhotoGrid filters={filters} useDirectLinks={true} />;
}
