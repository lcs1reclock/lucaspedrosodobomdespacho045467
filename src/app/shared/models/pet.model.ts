export interface Pet {
  id: number;
  nome: string;
  especie: string;
  idade: number;
  raca: string;
  urlFoto?: string;
}

export interface PetListResponse {
  content: Pet[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
