import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tutor, TutorListResponse } from '../../shared/models';
import { Pet } from '../../shared/models/pet.model';

@Injectable({ providedIn: 'root' })
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/v1/tutores`;

  list(page = 0, size = 10, nome?: string): Observable<TutorListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (nome) {
      params = params.set('nome', nome);
    }

    return this.http.get<TutorListResponse>(this.API, { params });
  }

  getById(id: number): Observable<Tutor> {
    return this.http.get<Tutor>(`${this.API}/${id}`);
  }

  create(tutor: { nome: string; telefone: string; endereco: string }): Observable<Tutor> {
    return this.http.post<Tutor>(this.API, tutor);
  }

  update(id: number, tutor: { nome: string; telefone: string; endereco: string }): Observable<Tutor> {
    return this.http.put<Tutor>(`${this.API}/${id}`, tutor);
  }

  uploadFoto(tutorId: number, file: File): Observable<Tutor> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<Tutor>(`${this.API}/${tutorId}/fotos`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  // Vinculação Pet-Tutor
  vincularPet(tutorId: number, petId: number): Observable<void> {
    return this.http.post<void>(`${this.API}/${tutorId}/pets/${petId}`, {});
  }

  desvincularPet(tutorId: number, petId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${tutorId}/pets/${petId}`);
  }

  getPetsVinculados(tutorId: number): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.API}/${tutorId}/pets`);
  }
}
