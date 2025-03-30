"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import PhotoGrid from "@/components/photo-grid";
import { Input } from "@/components/ui/input";
import Header from "@/components/header";
import Filters, { type FilterOptions } from "@/components/filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/context/auth-context";
import { useSearchParams } from "next/navigation";
import { PhotoModal } from "@/components/photo-modal";

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    order: "desc",
    orderBy: "createdAt",
  });
  const searchParams = useSearchParams();
  const postId = searchParams.get("post");
  const [isModalOpen, setIsModalOpen] = useState(!!postId);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Atualizar o título da página
  useEffect(() => {
    document.title = "Mural de Fotos";
  }, []);

  // Abrir modal quando o parâmetro post estiver presente na URL
  useEffect(() => {
    setIsModalOpen(!!postId);
  }, [postId]);

  // Melhorar a lógica de restauração do scroll no useEffect
  useEffect(() => {
    // Restaurar a posição de rolagem quando o componente montar
    if (typeof window !== "undefined") {
      // Pequeno atraso para garantir que o DOM esteja completamente carregado
      const timer = setTimeout(() => {
        const savedScrollPosition = localStorage.getItem("scrollPosition_home");
        if (savedScrollPosition) {
          window.scrollTo(0, Number.parseInt(savedScrollPosition));
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Função para fechar o modal e atualizar a URL
  const handleCloseModal = useCallback(() => {
    // Atualizar a URL removendo o parâmetro post
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.pushState({}, "", url.toString());

    setIsModalOpen(false);
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">
            Mural de Fotos - Ciência da Computação UNIR
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bem-vindo ao mural de fotos do curso de Ciência da Computação da
            UNIR. Este espaço foi criado para compartilhar visualizações,
            diagramas e projetos relacionados às disciplinas do curso. Explore
            as imagens, comente e interaja com os trabalhos dos seus colegas e
            professores.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar fotos..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Filters
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            searchQuery={debouncedSearch}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <PhotoGrid filters={{ ...filters, search: debouncedSearch }} />
      </main>

      {/* Modal de visualização de foto */}
      {postId && (
        <PhotoModal
          postId={postId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
