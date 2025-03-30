"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface EditPostDialogProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: any) => void;
}

export function EditPostDialog({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}: EditPostDialogProps) {
  const [caption, setCaption] = useState(post.caption || "");
  const [isPublic, setIsPublic] = useState(post.public || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Você precisa estar autenticado para editar este post");
        return;
      }

      const response = await api.patch(
        `/posts/${post.id}`,
        {
          caption,
          public: isPublic,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Atualizar o post no componente pai
      onPostUpdated({
        ...post,
        caption,
        public: isPublic,
        ...response.data,
      });
    } catch (err: any) {
      console.error("Erro ao editar post:", err);
      setError(
        err?.response?.data?.message || "Não foi possível editar o post",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Editar Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-white bg-red-500 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caption">Título</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione um título para seu post"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="public">Tornar público</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
