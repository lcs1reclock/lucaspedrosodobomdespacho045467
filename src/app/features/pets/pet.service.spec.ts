import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PetService } from './pet.service';
import { Pet, PetListResponse } from '../../shared/models';

describe('PetService', () => {
    let service: PetService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PetService]
        });

        service = TestBed.inject(PetService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('Verifica se o serviço é criado corretamente', () => {
        expect(service).toBeTruthy();
    });

    describe('list', () => {
        it('Lista os Pets', async () => {
            const mockResponse: PetListResponse = {
                page: 0,
                size: 10,
                total: 2,
                pageCount: 1,
                content: [
                    { id: 1, nome: 'Rex', raca: 'Labrador', idade: 3 },
                    { id: 2, nome: 'Mia', raca: 'Persa', idade: 2 }
                ]
            };

            const listPromise = service.list().toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets?page=0&size=10');
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);

            const response = await listPromise;
            expect(response).toEqual(mockResponse);
        });

        it('Lista os Pets com filtro de nome', async () => {
            const mockResponse: PetListResponse = {
                page: 0,
                size: 5,
                total: 1,
                pageCount: 1,
                content: [{ id: 1, nome: 'Rex', raca: 'Labrador', idade: 3 }]
            };

            const listPromise = service.list(0, 5, 'Rex').toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets?page=0&size=5&nome=Rex');
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);

            const response = await listPromise;
            expect(response).toEqual(mockResponse);
        });
    });

    describe('Buscar Pet', () => {
        it('Busca um Pet por seu ID', async () => {
            const mockPet: Pet = {
                id: 1,
                nome: 'Rex',
                raca: 'Labrador',
                idade: 3,
                foto: {
                    id: 1,
                    nome: 'rex.jpg',
                    contentType: 'image/jpeg',
                    url: 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg'
                }
            };

            const getPromise = service.getById(1).toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets/1');
            expect(req.request.method).toBe('GET');
            req.flush(mockPet);

            const response = await getPromise;
            expect(response).toEqual(mockPet);
        });
    });

    describe('Criar Pet', () => {
        it('Cadastro de um novo Pet', async () => {
            const newPetData = { nome: 'Buddy', raca: 'Golden Retriever', idade: 1 };
            const mockCreatedPet: Pet = { id: 3, ...newPetData };

            const createPromise = service.create(newPetData).toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newPetData);
            req.flush(mockCreatedPet);

            const response = await createPromise;
            expect(response).toEqual(mockCreatedPet);
        });
    });

    describe('Atualizar Pet', () => {
        it('Atualiza um Pet existente', async () => {
            const updateData = { nome: 'Rex Updated', raca: 'Labrador Updated', idade: 4 };
            const mockUpdatedPet: Pet = { id: 1, ...updateData };

            const updatePromise = service.update(1, updateData).toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets/1');
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);
            req.flush(mockUpdatedPet);

            const response = await updatePromise;
            expect(response).toEqual(mockUpdatedPet);
        });
    });

    describe('Upload de Foto', () => {
        it('Faz upload da foto do Pet', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const mockUpdatedPet: Pet = {
                id: 1,
                nome: 'Rex',
                raca: 'Labrador',
                idade: 3,
                foto: {
                    id: 1,
                    nome: 'test.jpg',
                    contentType: 'image/jpeg',
                    url: 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg'
                }
            };

            const uploadPromise = service.uploadFoto(1, mockFile).toPromise();

            const req = httpMock.expectOne('https://pet-manager-api.geia.vip/v1/pets/1/fotos');
            expect(req.request.method).toBe('POST');

            // Verificar se é FormData
            expect(req.request.body instanceof FormData).toBe(true);
            req.flush(mockUpdatedPet);

            const response = await uploadPromise;
            expect(response).toEqual(mockUpdatedPet);
        });
    });
});