"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ImageIcon, X, Plus } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

type ImagePreview = {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  isPublic: boolean;
};

export default function UploadPage() {
  const { user, logout } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () =>
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
  }, [selectedImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newImages = Array.from(e.target.files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file),
        title: file.name.split(".")[0],
        description: "",
        isPublic: false,
      }));

    setSelectedImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) =>
    setSelectedImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });

  const handleUpdateImageField = (
    id: string,
    field: keyof ImagePreview,
    value: any,
  ) =>
    setSelectedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      await Promise.all(
        selectedImages.map(async (img) => {
          const formData = new FormData();
          formData.append("caption", img.title);
          formData.append("public", String(img.isPublic));
          formData.append("image", img.file, img.file.name);

          await api.post("/posts", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        }),
      );

      router.push("/");
    } catch (error) {
      console.error("Erro ao enviar as fotos:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Enviar Novas Fotos</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Label htmlFor="photo">Selecionar Fotos</Label>

          {selectedImages.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte suas fotos ou clique para selecionar
              </p>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedImages.map((img) => (
                  <div key={img.id} className="border rounded-lg p-4 space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={img.preview}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveImage(img.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={img.title}
                      onChange={(e) =>
                        handleUpdateImageField(img.id, "title", e.target.value)
                      }
                      placeholder="Título"
                      required
                    />
                    <Textarea
                      value={img.description}
                      onChange={(e) =>
                        handleUpdateImageField(
                          img.id,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Descrição (opcional)"
                      rows={2}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={img.isPublic}
                        onCheckedChange={(checked) =>
                          handleUpdateImageField(
                            img.id,
                            "isPublic",
                            checked === true,
                          )
                        }
                      />
                      <Label>Tornar pública</Label>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !selectedImages.length}
          >
            {isSubmitting
              ? "Enviando..."
              : `Enviar ${selectedImages.length} foto(s)`}
          </Button>
        </form>
      </main>
    </>
  );
}
