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
import api, { uploadImage } from "@/lib/api";
import PhotoGrid from "@/components/photo-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FilterOptions } from "@/components/filters";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActiveTab = "profile" | "posts" | "likes" | "comments";

interface UserExtras {
  likedPosts: any[];
  comments: any[];
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-b-transparent animate-spin" />
    </div>
  );
}

interface AvatarSectionProps {
  name: string;
  avatarUrl: string;
  isUploading: boolean;
  onSelectImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function AvatarSection({
  name,
  avatarUrl,
  isUploading,
  onSelectImage,
  fileInputRef,
  onAvatarChange,
}: AvatarSectionProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24 relative">
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        <AvatarImage
          src={avatarUrl || "/placeholder.svg?height=96&width=96"}
          alt={name}
        />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex items-center">
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="hidden"
          ref={fileInputRef}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onSelectImage}
          size="sm"
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Enviando..." : "Alterar foto"}
        </Button>
      </div>
    </div>
  );
}

interface ProfileFormCardProps {
  name: string;
  bio: string;
  password: string;
  avatarUrl: string;
  isSubmitting: boolean;
  isUploading: boolean;
  hasChanges: boolean;
  success: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  avatarSection: React.ReactNode;
}

function ProfileFormCard({
  name,
  bio,
  password,
  avatarUrl,
  isSubmitting,
  isUploading,
  hasChanges,
  success,
  error,
  onSubmit,
  onNameChange,
  onBioChange,
  onPasswordChange,
  avatarSection,
}: ProfileFormCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>
          Visualize e edite suas informações de perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
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

          {avatarSection}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Fale sobre você..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
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
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>

          {!hasChanges && (
            <p className="text-center text-xs text-muted-foreground">
              Faça pelo menos uma alteração para salvar.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

interface LikesTabProps {
  likedPosts: any[];
  isLoadingLikes: boolean;
  filters: FilterOptions;
  userId: string;
}

function LikesTab({
  likedPosts,
  isLoadingLikes,
  filters,
  userId,
}: LikesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotos que você curtiu</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingLikes ? (
          <Spinner />
        ) : likedPosts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Você ainda não curtiu nenhuma foto.
          </p>
        ) : (
          <PhotoGrid filters={{ ...filters, userId }} useDirectLinks />
        )}
      </CardContent>
    </Card>
  );
}

interface CommentsTabProps {
  userComments: any[];
  isLoadingComments: boolean;
}

function CommentsTab({ userComments, isLoadingComments }: CommentsTabProps) {
  if (isLoadingComments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seus comentários</CardTitle>
        </CardHeader>
        <CardContent>
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus comentários</CardTitle>
      </CardHeader>
      <CardContent>
        {userComments.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Você ainda não comentou nenhuma foto.
          </p>
        ) : (
          <div className="space-y-4">
            {userComments.map((comment: any) => (
              <div key={comment.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                    {comment.post?.isVideo ? (
                      <video
                        src={comment.post?.imageUrl}
                        className="h-full w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={comment.post?.imageUrl}
                        className="h-full w-full object-cover"
                        alt={comment.post?.caption || "Post"}
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {comment.post?.caption || "Sem título"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Comentário:{" "}
                      <span className="text-foreground">{comment.content}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [originalData, setOriginalData] = useState({
    bio: "",
    avatarUrl: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [extras, setExtras] = useState<UserExtras>({
    likedPosts: [],
    comments: [],
  });
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
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }

    setName(user.name || "");
    setBio(user.bio || "");
    setAvatarUrl(user.avatarUrl || "");
    setOriginalData({
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
    });

    const fetchUserExtras = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setExtras({
          likedPosts: data.likes?.flatMap((it: any) => it.post) || [],
          comments: data.comments || [],
        });
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      } finally {
        setIsLoadingLikes(false);
        setIsLoadingComments(false);
      }
    };

    fetchUserExtras();
  }, [user, router]);

  useEffect(() => {
    const hasChanged =
      bio !== originalData.bio ||
      avatarUrl !== originalData.avatarUrl ||
      password.length > 0;
    setHasChanges(hasChanged);
  }, [bio, avatarUrl, password, originalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      setError("Faça pelo menos uma alteração.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const updateData: any = {};

      if (bio !== originalData.bio) updateData.bio = bio;
      if (password) updateData.password = password;
      if (avatarUrl !== originalData.avatarUrl)
        updateData.avatarUrl = avatarUrl;

      const response = await api.patch("/users/me", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateProfile?.(response.data);
      setOriginalData({ bio, avatarUrl });
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
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setAvatarUrl(imageUrl);
    } catch {
      setError("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  const avatarSection = (
    <AvatarSection
      name={name}
      avatarUrl={avatarUrl}
      isUploading={isUploading}
      onSelectImage={handleSelectImage}
      fileInputRef={fileInputRef}
      onAvatarChange={handleAvatarChange}
    />
  );

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs
          defaultValue="profile"
          onValueChange={(value) => setActiveTab(value as ActiveTab)}
        >
          <div className="mb-6 flex justify-center">
            <TabsList>
              <TabsTrigger value="profile" className="px-6">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="posts">
                <Grid className="mr-2 h-4 w-4" />
                Meus Posts
              </TabsTrigger>
              <TabsTrigger value="likes">Curtidas</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="flex justify-center">
            <ProfileFormCard
              name={name}
              bio={bio}
              password={password}
              avatarUrl={avatarUrl}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              hasChanges={hasChanges}
              success={success}
              error={error}
              onSubmit={handleSubmit}
              onNameChange={setName}
              onBioChange={setBio}
              onPasswordChange={setPassword}
              avatarSection={avatarSection}
            />
          </TabsContent>

          <TabsContent value="posts">
            <h2 className="mb-2 flex items-center text-xl font-semibold">
              <Grid className="mr-2 h-5 w-5" /> Meus Posts
            </h2>
            <PhotoGrid filters={filters} />
          </TabsContent>

          <TabsContent value="likes">
            <LikesTab
              likedPosts={extras.likedPosts}
              isLoadingLikes={isLoadingLikes}
              filters={filters}
              userId={user.id}
            />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsTab
              userComments={extras.comments}
              isLoadingComments={isLoadingComments}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
