"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Calendar,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Users,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import api from "@/lib/api";

export type FilterOptions = {
  order: string;
  orderBy: string;
  userId?: string;
  search?: string;
};

interface FiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  isAuthenticated: boolean;
}

type User = {
  id: string;
  name: string;
  email: string;
};

export default function Filters({
  onFilterChange,
  initialFilters,
  isAuthenticated,
}: FiltersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    order: initialFilters?.order || "desc",
    orderBy: initialFilters?.orderBy || "createdAt",
    userId: initialFilters?.userId || undefined,
  });
  const [isOpen, setIsOpen] = useState(false);

  // --- Estados de busca e paginação ---
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const USERS_LIMIT = 20;

  // --- Buscar usuários com paginação e busca ---
  const fetchUsers = async (page = 1, reset = false) => {
    if (!isAuthenticated) return;

    try {
      setIsLoadingUsers(true);

      const token = localStorage.getItem("token");
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { page, limit: USERS_LIMIT },
          }
        : {
            params: { page, limit: USERS_LIMIT },
          };

      const response = await api.get("/users", config);
      const data: User[] = response.data.data || [];

      setUsers((prev) => (reset ? data : [...prev, ...data]));
      setHasMoreUsers(data.length === USERS_LIMIT);
      setUserPage(page);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Carregar primeira página quando autenticado
  useEffect(() => {
    if (isAuthenticated) fetchUsers(1, true);
  }, [isAuthenticated]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      order: "desc",
      orderBy: "createdAt",
      userId: undefined,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const getOrderByIcon = () => {
    switch (filters.orderBy) {
      case "createdAt":
        return <Calendar className="h-4 w-4 mr-2" />;
      case "likes":
        return <Heart className="h-4 w-4 mr-2" />;
      case "comments":
        return <MessageSquare className="h-4 w-4 mr-2" />;
      default:
        return <Calendar className="h-4 w-4 mr-2" />;
    }
  };

  const getOrderIcon = () =>
    filters.order === "desc" ? (
      <ChevronDown className="h-4 w-4 mr-2" />
    ) : (
      <ChevronUp className="h-4 w-4 mr-2" />
    );

  const getOrderByLabel = (value: string) => {
    switch (value) {
      case "createdAt":
        return "Data de publicação";
      case "likes":
        return "Curtidas";
      case "comments":
        return "Comentários";
      default:
        return "Ordenar por";
    }
  };

  const handleLoadMoreUsers = () => {
    if (!isLoadingUsers && hasMoreUsers) {
      fetchUsers(userPage + 1, false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <TooltipProvider>
      <div className="mb-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </h2>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetFilters}
                    className="h-9 w-9"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resetar filtros</p>
                </TooltipContent>
              </Tooltip>

              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {isOpen ? "Ocultar filtros" : "Mostrar filtros"}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
              {/* ORDENAR POR */}
              <div className="space-y-2">
                <Label htmlFor="orderBy" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ordenar por
                </Label>

                <Select
                  value={filters.orderBy}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "orderBy",
                      value as "createdAt" | "likes" | "comments",
                    )
                  }
                >
                  <SelectTrigger id="orderBy" className="w-full">
                    <SelectValue>
                      <div className="flex items-center">
                        {getOrderByIcon()}
                        {getOrderByLabel(filters.orderBy)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="createdAt">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Data de publicação
                      </div>
                    </SelectItem>
                    <SelectItem value="likes">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Curtidas
                      </div>
                    </SelectItem>
                    <SelectItem value="comments">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comentários
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DIREÇÃO */}
              <div className="space-y-2">
                <Label htmlFor="order" className="flex items-center">
                  {getOrderIcon()}
                  Direção
                </Label>

                <Select
                  value={filters.order}
                  onValueChange={(value) =>
                    handleFilterChange("order", value as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="order" className="w-full">
                    <SelectValue>
                      <div className="flex items-center">
                        {getOrderIcon()}
                        {filters.order === "desc"
                          ? "Maior para menor"
                          : "Menor para maior"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="desc">
                      <div className="flex items-center">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Maior para menor
                      </div>
                    </SelectItem>
                    <SelectItem value="asc">
                      <div className="flex items-center">
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Menor para maior
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FILTRAR POR USUÁRIO */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Filtrar por usuário
                </Label>

                <Select
                  value={filters.userId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "userId",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger id="userId" className="w-full">
                    <SelectValue>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {filters.userId
                          ? users.find((u) => u.id === filters.userId)?.name ||
                            "Usuário"
                          : "Todos os usuários"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Todos os usuários
                      </div>
                    </SelectItem>

                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {user.name || user.email}
                        </div>
                      </SelectItem>
                    ))}

                    {/* PAGINAÇÃO */}
                    {hasMoreUsers && (
                      <div className="p-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleLoadMoreUsers}
                          disabled={isLoadingUsers}
                        >
                          {isLoadingUsers
                            ? "Carregando..."
                            : "Carregar mais usuários"}
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}
