import { Pet, Foto } from './pet.model';

export interface Tutor {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  foto?: Foto | null;
  pets?: Pet[];
}

export interface TutorListResponse {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: Tutor[];
}
