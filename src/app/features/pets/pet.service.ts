import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pet, PetListResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/v1/pets`;

  list(page = 0, size = 10, nome?: string): Observable<PetListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (nome) {
      params = params.set('nome', nome);
    }

    return this.http.get<PetListResponse>(this.API, { params });
  }

  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.API}/${id}`);
  }

  create(pet: { nome: string; raca: string; idade: number }): Observable<Pet> {
    return this.http.post<Pet>(this.API, pet);
  }

  update(id: number, pet: { nome: string; raca: string; idade: number }): Observable<Pet> {
    return this.http.put<Pet>(`${this.API}/${id}`, pet);
  }

  uploadFoto(petId: number, file: File): Observable<Pet> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<Pet>(`${this.API}/${petId}/fotos`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
