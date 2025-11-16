"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import PhotoGrid from "@/components/photo-grid";
import { Input } from "@/components/ui/input";
import Header from "@/components/header";
import Filters, { type FilterOptions } from "@/components/filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/context/auth-context";
import { PhotoModal } from "@/components/photo-modal";

const PAGE_TITLE = "Mural de Fotos";
const SCROLL_STORAGE_KEY = "scrollPosition_home";

function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function useScrollRestoration(storageKey: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      const savedScrollPosition = window.localStorage.getItem(storageKey);
      if (savedScrollPosition) {
        window.scrollTo(0, Number.parseInt(savedScrollPosition, 10));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [storageKey]);
}

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-md mx-auto w-full">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Pesquisar fotos..."
        className="w-full pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

type FiltersSectionProps = {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  searchQuery: string;
  isAuthenticated: boolean;
};

function FiltersSection({
  filters,
  onFilterChange,
  searchQuery,
  isAuthenticated,
}: FiltersSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <SearchBar
        value={searchQuery}
        onChange={onFilterChangeSearchWrapper(onFilterChange, filters)}
      />

      <Filters
        onFilterChange={onFilterChange}
        initialFilters={filters}
        searchQuery={searchQuery}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

function onFilterChangeSearchWrapper(
  onFilterChange: (filters: FilterOptions) => void,
  currentFilters: FilterOptions,
) {
  return (value: string) => {
    onFilterChange({ ...currentFilters, search: value });
  };
}

function PageIntro() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-3">
        Mural de Fotos - Ciência da Computação UNIR
      </h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Bem-vindo ao mural de fotos do curso de Ciência da Computação da UNIR.
        Este espaço foi criado para compartilhar visualizações, diagramas e
        projetos relacionados às disciplinas do curso. Explore as imagens,
        comente e interaja com os trabalhos dos seus colegas e professores.
      </p>
    </div>
  );
}

function usePhotoModalFromQuery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const postId = searchParams.get("post");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!postId);

  useEffect(() => {
    setIsModalOpen(!!postId);
  }, [postId]);

  const handleCloseModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("post");

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
    setIsModalOpen(false);
  }, [pathname, router, searchParams]);

  return { postId, isModalOpen, handleCloseModal };
}

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    order: "desc",
    orderBy: "createdAt",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);
  const isSearching = useMemo(
    () => !!debouncedSearch && debouncedSearch.length > 0,
    [debouncedSearch],
  );

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const { postId, isModalOpen, handleCloseModal } = usePhotoModalFromQuery();

  usePageTitle(PAGE_TITLE);
  useScrollRestoration(SCROLL_STORAGE_KEY);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <PageIntro />

        <div className="flex flex-col gap-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <Filters
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            searchQuery={debouncedSearch}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <PhotoGrid
          filters={{ ...filters, search: debouncedSearch }}
          useSearchEndpoint={isSearching}
        />
      </main>

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
