import { Tutor } from './tutor.model';

export interface Foto {
  id: number;
  nome: string;
  contentType: string;
  url: string;
}

export interface Pet {
  id: number;
  nome: string;
  raca: string;
  idade: number;
  foto?: Foto | null;
  tutor?: Tutor | null;
}

export interface PetListResponse {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: Pet[];
}
