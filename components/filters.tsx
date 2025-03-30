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
  order: "asc" | "desc";
  orderBy: "createdAt" | "likes" | "comments";
  userId?: string;
  search?: string;
};

interface FiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  searchQuery?: string;
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
  searchQuery,
  isAuthenticated,
}: FiltersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    order: initialFilters?.order || "desc",
    orderBy: initialFilters?.orderBy || "createdAt",
    userId: initialFilters?.userId || undefined,
    search: searchQuery,
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Buscar usuários apenas se estiver autenticado
    if (isAuthenticated) {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("token");
          const config = token
            ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
            : undefined;

          const response = await api.get("/users", config);
          setUsers(response.data.data || []);
        } catch (error) {
          console.error("Erro ao buscar usuários:", error);
        }
      };

      fetchUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, search: searchQuery }));
    }
  }, [searchQuery]);

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
      search: searchQuery,
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

  const getOrderIcon = () => {
    return filters.order === "desc" ? (
      <ChevronDown className="h-4 w-4 mr-2" />
    ) : (
      <ChevronUp className="h-4 w-4 mr-2" />
    );
  };

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

  const getOrderLabel = (value: string, orderBy: string) => {
    if (value === "desc") {
      switch (orderBy) {
        case "createdAt":
          return "Mais recentes primeiro";
        case "likes":
          return "Mais curtidas primeiro";
        case "comments":
          return "Mais comentados primeiro";
        default:
          return "Maior para menor";
      }
    } else {
      switch (orderBy) {
        case "createdAt":
          return "Mais antigos primeiro";
        case "likes":
          return "Menos curtidas primeiro";
        case "comments":
          return "Menos comentados primeiro";
        default:
          return "Menor para maior";
      }
    }
  };

  // Se não estiver autenticado, não mostrar os filtros avançados
  if (!isAuthenticated) {
    return null;
  }

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
                    <SelectValue placeholder="Ordenar por">
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

              <div className="space-y-2">
                <Label htmlFor="order" className="flex items-center">
                  {filters.order === "desc" ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  )}
                  Direção
                </Label>
                <Select
                  value={filters.order}
                  onValueChange={(value) =>
                    handleFilterChange("order", value as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="order" className="w-full">
                    <SelectValue placeholder="Direção">
                      <div className="flex items-center">
                        {getOrderIcon()}
                        {getOrderLabel(filters.order, filters.orderBy)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">
                      <div className="flex items-center">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        {filters.orderBy === "createdAt"
                          ? "Mais recentes primeiro"
                          : filters.orderBy === "likes"
                            ? "Mais curtidas primeiro"
                            : "Mais comentados primeiro"}
                      </div>
                    </SelectItem>
                    <SelectItem value="asc">
                      <div className="flex items-center">
                        <ChevronUp className="h-4 w-4 mr-2" />
                        {filters.orderBy === "createdAt"
                          ? "Mais antigos primeiro"
                          : filters.orderBy === "likes"
                            ? "Menos curtidas primeiro"
                            : "Menos comentados primeiro"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectValue placeholder="Todos os usuários">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {filters.userId
                          ? users.find((u) => u.id === filters.userId)?.name ||
                          "Usuário selecionado"
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
