import { Component, signal, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { PetService } from './pet.service';
import { AuthService } from '../../core/services/auth.service';
import { Pet } from '../../shared/models';

@Component({
  selector: 'app-pet-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pet-list.component.html',
  styleUrls: ['./pet-list.component.css']
})
export class PetListComponent implements OnDestroy, OnInit {
  private petService = inject(PetService);
  private authService = inject(AuthService);

  pets = signal<Pet[]>([]);
  loading = signal(false);
  page = signal(0);
  size = 10;
  totalPages = signal<number | null>(null);
  searchTerm = signal('');
  searchValue: string = '';

  private search$ = new Subject<string>();
  private sub = new Subscription();

  selectedPet = signal<Pet | null>(null);

  // Modais
  showCreateModal = signal(false);
  showEditModal = signal(false);
  createLoading = signal(false);
  editLoading = signal(false);

  // Drag and Drop
  isDragOverNew = signal(false);
  isDragOverEdit = signal(false);

  // Formulários
  newPet = signal({
    nome: '',
    raca: '',
    idade: 0,
    file: null as File | null,
    previewUrl: ''
  });

  editPet = signal({
    id: 0,
    nome: '',
    raca: '',
    idade: 0,
    file: null as File | null,
    previewUrl: ''
  });

  hasMore = computed(() => {
    const result = this.totalPages() === null ? true : (this.page() + 1) < (this.totalPages() as number);
    return result;
  });

  trackByPetId(index: number, pet: Pet): number {
    return pet.id;
  }

  constructor() {
    this.sub.add(
      this.search$.pipe(debounceTime(400)).subscribe(term => {
        this.page.set(0);
        if (term.trim()) {
          this.pets.set([]);
        }
        this.loadPets();
      })
    );
  }

  ngOnInit() {    
    //console.log('PetListComponent: ngOnInit iniciado - BROWSER LOG');
    if (!this.authService.isAuthenticated()) {
      //console.log('Tentando fazer login...');
      this.authService.login({ username: 'admin', password: 'admin' }).subscribe({
        next: (response) => {
          //console.log('Login ok: ', response);
          this.loadPets();
        },
        error: (err) => {
          console.error('Erro no login:', err);
        }
      });
    } else {
      //console.log('Já autenticado, carregar dados ...');
      this.loadPets();
    }
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  onSearchImmediate() {
    this.searchTerm.set(this.searchValue);
    this.page.set(0);
    if (this.searchValue.trim()) {
      this.pets.set([]);
    }
    this.loadPets();
  }

  loadPets() {
    if (this.loading()) return;
    this.loading.set(true);

    const page = this.page();
    const nome = this.searchTerm();

    //console.log('Fazendo requisição para API:', { page, size: this.size, nome });

    this.petService.list(page, this.size, nome).subscribe({
      next: (res) => {
        // console.log("Dados recebidos da API /v1/pets:");
        // console.log(JSON.stringify(res, null, 2));
        // console.log("Pets carregados:", res.content);
        const current = this.pets();
        this.pets.set([...current, ...res.content]);
        this.totalPages.set(res.pageCount);
        this.loading.set(false);
        //console.log("Total pets agora:", this.pets().length, "totalPages:", this.totalPages(), "hasMore:", this.hasMore());
      },
      error: (err) => {
        console.error('Erro ao carregar pets:', err);
        this.loading.set(false);

        // Se erro 401, tentar login novamente
        if (err.status === 401) {
          console.log('Token expirado, tentando login novamente...');
          this.authService.login({ username: 'admin', password: 'admin' }).subscribe({
            next: (response) => {
              console.log('Login renovado, carregando pets...');
              this.loadPets();
            },
            error: (loginErr) => {
              console.error('Falha no login renovado:', loginErr);
            }
          });
        }
      }
    });
  }

  loadMore() {
    if (!this.hasMore() || this.loading()) {
      return;
    }

    this.page.set(this.page() + 1);
    this.loadPets();
  }

  openDetails(pet: Pet) {
    this.selectedPet.set(pet);
  }

  closeDetails() {
    this.selectedPet.set(null);
  }

  // Métodos de Drag and Drop
  handleFileSelect(event: Event, isEdit: boolean = false) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file, isEdit);
    }
  }

  handleDragOver(event: DragEvent, isEdit: boolean = false) {
    event.preventDefault();
    event.stopPropagation();
    if (isEdit) {
      this.isDragOverEdit.set(true);
    } else {
      this.isDragOverNew.set(true);
    }
  }

  handleDragLeave(event: DragEvent, isEdit: boolean = false) {
    event.preventDefault();
    event.stopPropagation();
    if (isEdit) {
      this.isDragOverEdit.set(false);
    } else {
      this.isDragOverNew.set(false);
    }
  }

  handleDrop(event: DragEvent, isEdit: boolean = false) {
    event.preventDefault();
    event.stopPropagation();
    if (isEdit) {
      this.isDragOverEdit.set(false);
    } else {
      this.isDragOverNew.set(false);
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0], isEdit);
    }
  }

  private processFile(file: File, isEdit: boolean = false) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      if (isEdit) {
        this.editPet.update(pet => ({ ...pet, file, previewUrl }));
      } else {
        this.newPet.update(pet => ({ ...pet, file, previewUrl }));
      }
    };
    reader.readAsDataURL(file);
  }

  // Métodos para remover imagens
  removeNewPetImage() {
    this.newPet.update(pet => ({ ...pet, file: null, previewUrl: '' }));
  }

  removeEditPetImage() {
    this.editPet.update(pet => ({ ...pet, file: null, previewUrl: '' }));
  }

  // Métodos dos Modais
  openCreatePetModal() {
    this.newPet.set({
      nome: '',
      raca: '',
      idade: 0,
      file: null,
      previewUrl: ''
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.newPet.set({
      nome: '',
      raca: '',
      idade: 0,
      file: null,
      previewUrl: ''
    });
  }

  openEditPetModal(pet: Pet) {
    this.editPet.set({
      id: pet.id,
      nome: pet.nome,
      raca: pet.raca,
      idade: pet.idade,
      file: null,
      previewUrl: pet.foto?.url || ''
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editPet.set({
      id: 0,
      nome: '',
      raca: '',
      idade: 0,
      file: null,
      previewUrl: ''
    });
  }

  // Operações CRUD
  createPet() {
    if (!this.newPet().nome.trim() || !this.newPet().raca.trim()) {
      return;
    }

    this.createLoading.set(true);
    console.log('Iniciando criação de pet...');

    // Preparar payload JSON (sem foto)
    const payload = {
      nome: this.newPet().nome.trim(),
      raca: this.newPet().raca.trim(),
      idade: this.newPet().idade
    };

    const file = this.newPet().file;

    this.petService.create(payload)
      .pipe(
        switchMap((createdPet) => {
          console.log('Pet criado com sucesso:', createdPet);
          // Se há foto, fazer upload em seguida
          if (file) {
            console.log('Fazendo upload da foto...');
            return this.petService.uploadFoto(createdPet.id, file);
          }
          // Sem foto, retornar o pet criado
          return of(createdPet);
        }),
        catchError((error) => {
          console.error('Erro no processo:', error);
          this.createLoading.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Processo concluído com sucesso:', result);
          this.createLoading.set(false);
          this.closeCreateModal();
          // Recarregar lista após criação
          this.page.set(0);
          this.pets.set([]);
          this.loadPets();
        },
        error: (error) => {
          console.error('Erro final ao criar pet:', error);
          this.createLoading.set(false);
        }
      });
  }

  updatePet() {
    if (!this.editPet().nome.trim() || !this.editPet().raca.trim()) {
      return;
    }

    this.editLoading.set(true);
    console.log('Iniciando atualização de pet...');

    // Preparar payload JSON (sem foto)
    const payload = {
      nome: this.editPet().nome.trim(),
      raca: this.editPet().raca.trim(),
      idade: this.editPet().idade
    };

    const file = this.editPet().file;
    const petId = this.editPet().id;

    this.petService.update(petId, payload)
      .pipe(
        switchMap((updatedPet) => {
          console.log('Pet atualizado com sucesso:', updatedPet);
          // Se há uma nova foto (arquivo selecionado), fazer upload
          if (file) {
            console.log('Fazendo upload da nova foto...');
            return this.petService.uploadFoto(petId, file);
          }
          // Sem nova foto, retornar o pet atualizado
          return of(updatedPet);
        }),
        catchError((error) => {
          console.error('Erro no processo de atualização:', error);
          this.editLoading.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Processo de atualização concluído:', result);
          this.editLoading.set(false);
          this.closeEditModal();
          // Recarregar lista após atualização
          this.page.set(0);
          this.pets.set([]);
          this.loadPets();
        },
        error: (error) => {
          console.error('Erro final ao atualizar pet:', error);
          this.editLoading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
