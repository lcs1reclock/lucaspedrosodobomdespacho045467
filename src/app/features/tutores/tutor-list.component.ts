import { Component, signal, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { TutorService } from './tutor.service';
import { PetService } from '../pets/pet.service';
import { AuthService } from '../../core/services/auth.service';
import { Tutor, Pet } from '../../shared/models';

@Component({
  selector: 'app-tutor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutor-list.component.html',
  styleUrls: ['./tutor-list.component.css']
})
export class TutorListComponent implements OnDestroy, OnInit {
  private tutorService = inject(TutorService);
  private petService = inject(PetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  tutores = signal<Tutor[]>([]);
  loading = signal(false);
  page = signal(0);
  size = 10;
  totalPages = signal<number | null>(null);
  searchTerm = signal('');
  searchValue: string = '';

  private search$ = new Subject<string>();
  private sub = new Subscription();

  selectedTutor = signal<Tutor | null>(null);
  petsVinculados = signal<Pet[]>([]);

  // Modais
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showVincularModal = signal(false);
  createLoading = signal(false);
  editLoading = signal(false);

  // Drag and Drop
  isDragOverNew = signal(false);
  isDragOverEdit = signal(false);

  // Formulários
  newTutor = signal({
    nome: '',
    telefone: '',
    endereco: '',
    file: null as File | null,
    previewUrl: ''
  });

  editTutor = signal({
    id: 0,
    nome: '',
    telefone: '',
    endereco: '',
    file: null as File | null,
    previewUrl: ''
  });

  // Pets disponíveis para vincular
  petsDisponiveis = signal<Pet[]>([]);
  petSelecionadoIdValue: number | null = null;

  hasMore = computed(() => {
    const result = this.totalPages() === null ? true : (this.page() + 1) < (this.totalPages() as number);
    return result;
  });

  trackByTutorId(index: number, tutor: Tutor): number {
    return tutor.id;
  }

  trackByPetId(index: number, pet: Pet): number {
    return pet.id;
  }

  constructor() {
    this.sub.add(
      this.search$.pipe(debounceTime(400)).subscribe(term => {
        this.page.set(0);
        if (term.trim()) {
          this.tutores.set([]);
        }
        this.loadTutores();
      })
    );
  }

  ngOnInit() {
    console.log('TutorListComponent: ngOnInit iniciado');
    if (!this.authService.isAuthenticated()) {
      console.log('Tentando fazer login...');
      this.authService.login({ username: 'admin', password: 'admin' }).subscribe({
        next: (response) => {
          console.log('Login ok: ', response);
          this.loadTutores();
        },
        error: (err) => {
          console.error('Erro no login:', err);
        }
      });
    } else {
      console.log('Já autenticado, carregar dados ...');
      this.loadTutores();
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
      this.tutores.set([]);
    }
    this.loadTutores();
  }

  loadTutores() {
    if (this.loading()) return;
    this.loading.set(true);

    const page = this.page();
    const nome = this.searchTerm();

    console.log('Fazendo requisição para API:', { page, size: this.size, nome });

    this.tutorService.list(page, this.size, nome).subscribe({
      next: (res) => {
        console.log("Dados recebidos da API /v1/tutores:");
        console.log(JSON.stringify(res, null, 2));
        console.log("Tutores carregados:", res.content);

        const current = this.tutores();
        this.tutores.set([...current, ...res.content]);
        this.totalPages.set(res.pageCount);
        this.loading.set(false);

        console.log("Total tutores agora:", this.tutores().length, "totalPages:", this.totalPages(), "hasMore:", this.hasMore());
      },
      error: (err) => {
        console.error('Erro ao carregar tutores:', err);
        this.loading.set(false);

        if (err.status === 401) {
          console.log('Token expirado, tentando login novamente...');
          this.authService.login({ username: 'admin', password: 'admin' }).subscribe({
            next: (response) => {
              console.log('Login renovado, carregando tutores...');
              this.loadTutores();
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
    this.loadTutores();
  }

  openDetails(tutor: Tutor) {
    this.tutorService.getById(tutor.id).subscribe({
      next: (tutorDetails) => {
        console.log('Detalhes completos do tutor:', tutorDetails);
        this.selectedTutor.set(tutorDetails);
        
        // Carregar pets vinculados
        if (tutorDetails.pets && tutorDetails.pets.length > 0) {
          this.petsVinculados.set(tutorDetails.pets);
        } else {
          this.petsVinculados.set([]);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes do tutor:', err);
        this.selectedTutor.set(tutor);
        this.petsVinculados.set([]);
      }
    });
  }

  closeDetails() {
    this.selectedTutor.set(null);
    this.petsVinculados.set([]);
  }

  // Drag and Drop
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
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      if (isEdit) {
        this.editTutor.update(tutor => ({ ...tutor, file, previewUrl }));
      } else {
        this.newTutor.update(tutor => ({ ...tutor, file, previewUrl }));
      }
    };
    reader.readAsDataURL(file);
  }

  removeNewTutorImage() {
    this.newTutor.update(tutor => ({ ...tutor, file: null, previewUrl: '' }));
  }

  removeEditTutorImage() {
    this.editTutor.update(tutor => ({ ...tutor, file: null, previewUrl: '' }));
  }

  // Modais
  openCreateTutorModal() {
    this.newTutor.set({
      nome: '',
      telefone: '',
      endereco: '',
      file: null,
      previewUrl: ''
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.newTutor.set({
      nome: '',
      telefone: '',
      endereco: '',
      file: null,
      previewUrl: ''
    });
  }

  openEditTutorModal(tutor: Tutor) {
    this.editTutor.set({
      id: tutor.id,
      nome: tutor.nome,
      telefone: tutor.telefone,
      endereco: tutor.endereco,
      file: null,
      previewUrl: tutor.foto?.url || ''
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editTutor.set({
      id: 0,
      nome: '',
      telefone: '',
      endereco: '',
      file: null,
      previewUrl: ''
    });
  }

  // CRUD
  createTutor() {
    if (!this.newTutor().nome.trim() || !this.newTutor().telefone.trim() || !this.newTutor().endereco.trim()) {
      return;
    }

    this.createLoading.set(true);
    console.log('Iniciando criação de tutor...');

    const payload = {
      nome: this.newTutor().nome.trim(),
      telefone: this.newTutor().telefone.trim(),
      endereco: this.newTutor().endereco.trim()
    };

    const file = this.newTutor().file;

    this.tutorService.create(payload)
      .pipe(
        switchMap((createdTutor) => {
          console.log('Tutor criado com sucesso:', createdTutor);
          if (file) {
            console.log('Fazendo upload da foto...');
            return this.tutorService.uploadFoto(createdTutor.id, file);
          }
          return of(createdTutor);
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
          this.page.set(0);
          this.tutores.set([]);
          this.loadTutores();
        },
        error: (error) => {
          console.error('Erro final ao criar tutor:', error);
          this.createLoading.set(false);
        }
      });
  }

  updateTutor() {
    if (!this.editTutor().nome.trim() || !this.editTutor().telefone.trim() || !this.editTutor().endereco.trim()) {
      return;
    }

    this.editLoading.set(true);
    console.log('Iniciando atualização de tutor...');

    const payload = {
      nome: this.editTutor().nome.trim(),
      telefone: this.editTutor().telefone.trim(),
      endereco: this.editTutor().endereco.trim()
    };

    const file = this.editTutor().file;
    const tutorId = this.editTutor().id;

    this.tutorService.update(tutorId, payload)
      .pipe(
        switchMap((updatedTutor) => {
          console.log('Tutor atualizado com sucesso:', updatedTutor);
          if (file) {
            console.log('Fazendo upload da nova foto...');
            return this.tutorService.uploadFoto(tutorId, file);
          }
          return of(updatedTutor);
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
          this.page.set(0);
          this.tutores.set([]);
          this.loadTutores();
        },
        error: (error) => {
          console.error('Erro final ao atualizar tutor:', error);
          this.editLoading.set(false);
        }
      });
  }

  // Vinculação
  openVincularModal() {
    // Carregar pets disponíveis (todos os pets)
    this.petService.list(0, 100).subscribe({
      next: (res) => {
        this.petsDisponiveis.set(res.content);
        this.petSelecionadoIdValue = null;
        this.showVincularModal.set(true);
      },
      error: (err) => {
        console.error('Erro ao carregar pets:', err);
      }
    });
  }

  closeVincularModal() {
    this.showVincularModal.set(false);
    this.petsDisponiveis.set([]);
    this.petSelecionadoIdValue = null;
  }

  vincularPet() {
    const tutorId = this.selectedTutor()?.id;
    const petId = this.petSelecionadoIdValue;

    if (!tutorId || !petId) return;

    this.tutorService.vincularPet(tutorId, petId).subscribe({
      next: () => {
        console.log('Pet vinculado com sucesso');
        this.closeVincularModal();
        // Recarregar detalhes do tutor
        this.openDetails(this.selectedTutor()!);
      },
      error: (err) => {
        console.error('Erro ao vincular pet:', err);
      }
    });
  }

  desvincularPet(petId: number) {
    const tutorId = this.selectedTutor()?.id;
    if (!tutorId) return;

    if (confirm('Deseja realmente desvincular este pet?')) {
      this.tutorService.desvincularPet(tutorId, petId).subscribe({
        next: () => {
          console.log('Pet desvinculado com sucesso');
          // Recarregar detalhes do tutor
          this.openDetails(this.selectedTutor()!);
        },
        error: (err) => {
          console.error('Erro ao desvincular pet:', err);
        }
      });
    }
  }

  navigateToPets() {
    this.router.navigate(['/pets']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
