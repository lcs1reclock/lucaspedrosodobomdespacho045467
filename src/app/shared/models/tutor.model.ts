export interface Tutor {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  urlFoto?: string;
}

export interface TutorListResponse {
  content: Tutor[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
