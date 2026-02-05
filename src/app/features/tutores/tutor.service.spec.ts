import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TutorService } from './tutor.service';
import { Tutor, TutorListResponse } from '../../shared/models';
import { Pet } from '../../shared/models/pet.model';

describe('TutorService', () => {
  let service: TutorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TutorService]
    });

    service = TestBed.inject(TutorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Verifica se o serviço é criado corretamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Buscar dados', () => {
    it('Lista os Tutores', async () => {
      const mockResponse: TutorListResponse = {
        page: 0,
        size: 10,
        total: 2,
        pageCount: 1,
        content: [
          { id: 1, nome: 'João Silva', telefone: '11999999999', endereco: 'Rua A, 123' },
          { id: 2, nome: 'Maria Santos', telefone: '11888888888', endereco: 'Rua B, 456' }
        ]
      };

      const listPromise = service.list().toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores?page=0&size=10');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await listPromise;
      expect(response).toEqual(mockResponse);
    });
  });

  describe('Buscar dados por ID', () => {
    it('Busca um Tutor por seu ID', async () => {
      const mockTutor: Tutor = {
        id: 1,
        nome: 'João Silva',
        telefone: '11999999999',
        endereco: 'Rua A, 123',
        foto: {
          id: 1,
          nome: 'joao.jpg',
          contentType: 'image/jpeg',
          url: 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg'
        },
        pets: [
          { id: 1, nome: 'Rex', raca: 'Labrador', idade: 3 }
        ]
      };

      const getPromise = service.getById(1).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockTutor);

      const response = await getPromise;
      expect(response).toEqual(mockTutor);
    });
  });

  describe('Cadastrar Tutor', () => {
    it('Cadastra um novo Tutor', async () => {
      const newTutorData = {
        nome: 'Carlos Oliveira',
        telefone: '11777777777',
        endereco: 'Rua C, 789'
      };
      const mockCreatedTutor: Tutor = { id: 3, ...newTutorData };

      const createPromise = service.create(newTutorData).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTutorData);
      req.flush(mockCreatedTutor);

      const response = await createPromise;
      expect(response).toEqual(mockCreatedTutor);
    });
  });

  describe('Atualizar Tutor', () => {
    it('Atualiza um Tutor existente', async () => {
      const updateData = {
        nome: 'João Silva Atualizado',
        telefone: '11999999999',
        endereco: 'Rua A, 123 - Atualizado'
      };
      const mockUpdatedTutor: Tutor = { id: 1, ...updateData };

      const updatePromise = service.update(1, updateData).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockUpdatedTutor);

      const response = await updatePromise;
      expect(response).toEqual(mockUpdatedTutor);
    });
  });

  describe('Upload de Foto', () => {
    it('Upload da foto do Tutor', async () => {
      const mockFile = new File(['test'], 'tutor.jpg', { type: 'image/jpeg' });
      const mockUpdatedTutor: Tutor = {
        id: 1,
        nome: 'João Silva',
        telefone: '11999999999',
        endereco: 'Rua A, 123',
        foto: {
          id: 1,
          nome: 'tutor.jpg',
          contentType: 'image/jpeg',
          url: 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg'
        }
      };

      const uploadPromise = service.uploadFoto(1, mockFile).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1/fotos');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockUpdatedTutor);

      const response = await uploadPromise;
      expect(response).toEqual(mockUpdatedTutor);
    });
  });

  describe('Vincular Pet', () => {
    it('Vincula um Pet ao Tutor', async () => {
      const vincularPromise = service.vincularPet(1, 5).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1/pets/5');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      const response = await vincularPromise;
      expect(response).toBeNull();
    });
  });

  describe('Desvincular Pet', () => {
    it('Desvincula um Pet do Tutor', async () => {
      const desvincularPromise = service.desvincularPet(1, 5).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1/pets/5');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      const response = await desvincularPromise;
      expect(response).toBeNull();
    });
  });

  describe('Pets Vinculados', () => {
    it('Lista os Pets vinculados ao Tutor', async () => {
      const mockPets: Pet[] = [
        { id: 1, nome: 'Rex', raca: 'Labrador', idade: 3 },
        { id: 2, nome: 'Mia', raca: 'Persa', idade: 2 }
      ];

      const getPetsPromise = service.getPetsVinculados(1).toPromise();

      const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/tutores/1/pets');
      expect(req.request.method).toBe('GET');
      req.flush(mockPets);

      const response = await getPetsPromise;
      expect(response).toEqual(mockPets);
    });
  });

});