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
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { PhoneMaskDirective } from '../../shared/directives/phone-mask.directive';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-tutor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, PhonePipe, PhoneMaskDirective],
  templateUrl: './tutor-list.component.html',
  styleUrls: ['./tutor-list.component.css']
})
export class TutorListComponent implements OnDestroy, OnInit {
  private tutorService = inject(TutorService);
  private petService = inject(PetService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

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
  showConfirmModal = signal(false);
  petToDesvincular = signal<number | null>(null);
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
  petsDisponiveisFiltrados = signal<Pet[]>([]);
  petSearchTerm = '';
  petSelecionado = signal<Pet | null>(null);
  petSelecionadoIdValue: number | null = null;
  loadingPets = signal(false);

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
    // Guard já garante que usuário está autenticado
    this.loadTutores();
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

    // console.log('Fazendo requisição para API:', { page, size: this.size, nome });

    this.tutorService.list(page, this.size, nome).subscribe({
      next: (res) => {
        // console.log("Dados recebidos da API /v1/tutores:");
        // console.log(JSON.stringify(res, null, 2));
        // console.log("Tutores carregados:", res.content);

        const current = this.tutores();
        this.tutores.set([...current, ...res.content]);
        this.totalPages.set(res.pageCount);
        this.loading.set(false);

        // console.log("Total tutores agora:", this.tutores().length, "totalPages:", this.totalPages(), "hasMore:", this.hasMore());
      },
      error: (err) => {
        // console.error('Erro ao carregar tutores:', err);
        this.loading.set(false);

        // Interceptor já trata erro 401 automaticamente
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
        // console.log('Detalhes completos do tutor:', tutorDetails);
        this.selectedTutor.set(tutorDetails);
        
        // Carregar pets vinculados
        if (tutorDetails.pets && tutorDetails.pets.length > 0) {
          this.petsVinculados.set(tutorDetails.pets);
        } else {
          this.petsVinculados.set([]);
        }
      },
      error: (err) => {
        // console.error('Erro ao carregar detalhes do tutor:', err);
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
      this.notificationService.error('Arquivo inválido', 'Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('Arquivo muito grande', 'O arquivo deve ter no máximo 5MB.');
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
    // console.log('Iniciando criação de tutor...');

    const payload = {
      nome: this.newTutor().nome.trim(),
      telefone: this.newTutor().telefone.trim(),
      endereco: this.newTutor().endereco.trim()
    };

    const file = this.newTutor().file;

    this.tutorService.create(payload)
      .pipe(
        switchMap((createdTutor) => {
          // console.log('Tutor criado com sucesso:', createdTutor);
          if (file) {
            // console.log('Fazendo upload da foto...');
            return this.tutorService.uploadFoto(createdTutor.id, file);
          }
          return of(createdTutor);
        }),
        catchError((error) => {
          // console.error('Erro no processo:', error);
          this.createLoading.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (result) => {
          // console.log('Processo concluído com sucesso:', result);
          this.notificationService.success('Tutor cadastrado', 'Tutor cadastrado com sucesso!');
          this.createLoading.set(false);
          this.closeCreateModal();
          this.page.set(0);
          this.tutores.set([]);
          this.loadTutores();
        },
        error: (error) => {
          // console.error('Erro final ao criar tutor:', error);
          this.createLoading.set(false);
        }
      });
  }

  updateTutor() {
    if (!this.editTutor().nome.trim() || !this.editTutor().telefone.trim() || !this.editTutor().endereco.trim()) {
      return;
    }

    this.editLoading.set(true);
    // console.log('Iniciando atualização de tutor...');

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
          // console.log('Tutor atualizado com sucesso:', updatedTutor);
          if (file) {
            // console.log('Fazendo upload da nova foto...');
            return this.tutorService.uploadFoto(tutorId, file);
          }
          return of(updatedTutor);
        }),
        catchError((error) => {
          // console.error('Erro no processo de atualização:', error);
          this.editLoading.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (result) => {
          // console.log('Processo de atualização concluído:', result);
          this.notificationService.success('Tutor atualizado', 'Tutor atualizado com sucesso!');
          this.editLoading.set(false);
          this.closeEditModal();
          this.page.set(0);
          this.tutores.set([]);
          this.loadTutores();
        },
        error: (error) => {
          // console.error('Erro final ao atualizar tutor:', error);
          this.editLoading.set(false);
        }
      });
  }

  // Vinculação
  openVincularModal() {
    const tutorId = this.selectedTutor()?.id;
    if (!tutorId) return;

    this.showVincularModal.set(true);
    this.loadingPets.set(true);
    
    // Carregar lista de pets (sem buscar detalhes de cada um)
    this.petService.list(0, 200).subscribe({
      next: (res) => {
        // IDs dos pets já vinculados ao tutor atual
        const petsVinculadosIds = this.petsVinculados().map(p => p.id);
        
        // Filtrar apenas pets que NÃO estão vinculados ao tutor atual
        const petsDisponiveis = res.content.filter(pet => 
          !petsVinculadosIds.includes(pet.id)
        );
        
        this.petsDisponiveis.set(petsDisponiveis);
        this.petsDisponiveisFiltrados.set(petsDisponiveis);
        this.petSearchTerm = '';
        this.petSelecionado.set(null);
        this.petSelecionadoIdValue = null;
        this.loadingPets.set(false);
      },
      error: (err) => {
        // console.error('Erro ao carregar tutores:', err);
        this.loadingPets.set(false);
      }
    });
  }

  closeVincularModal() {
    this.showVincularModal.set(false);
    this.petsDisponiveis.set([]);
    this.petsDisponiveisFiltrados.set([]);
    this.petSearchTerm = '';
    this.petSelecionado.set(null);
    this.petSelecionadoIdValue = null;
  }

  onPetSearchChange(searchTerm: string) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.petsDisponiveisFiltrados.set(this.petsDisponiveis());
      return;
    }
    
    const filtered = this.petsDisponiveis().filter(pet => {
      const nome = pet.nome?.toLowerCase() || '';
      const raca = pet.raca?.toLowerCase() || '';
      return nome.includes(term) || raca.includes(term);
    });
    this.petsDisponiveisFiltrados.set(filtered);
  }

  selecionarPet(pet: Pet) {
    // Buscar detalhes do pet para verificar se já tem tutor
    this.petService.getById(pet.id).subscribe({
      next: (petDetails) => {
        // Verificar se o pet já tem tutor vinculado
        if (petDetails.tutores && Array.isArray(petDetails.tutores) && petDetails.tutores.length > 0) {
          const tutorNome = petDetails.tutores[0].nome;
          this.notificationService.warning(
            'Pet já possui tutor',
            `O Pet ${petDetails.nome} já possui o tutor ${tutorNome}`
          );
          return;
        }
        
        // Pet está disponível, pode selecionar
        this.petSelecionado.set(pet);
        this.petSelecionadoIdValue = pet.id;
      },
      error: (err) => {
        // console.error('Erro ao verificar pet:', err);
        this.notificationService.error(
          'Erro',
          'Erro ao verificar disponibilidade do pet. Tente novamente.'
        );
      }
    });
  }

  vincularPet() {
    const tutorId = this.selectedTutor()?.id;
    const petId = this.petSelecionadoIdValue;

    if (!tutorId || !petId) return;

    this.tutorService.vincularPet(tutorId, petId).subscribe({
      next: () => {
        // console.log('Pet vinculado com sucesso');
        this.notificationService.success('Pet vinculado', 'Pet vinculado ao tutor com sucesso!');
        this.closeVincularModal();
        // Recarregar detalhes do tutor
        this.openDetails(this.selectedTutor()!);
      },
      error: (err) => {
        // console.error('Erro ao vincular pet:', err);
        const errorMessage = err.error?.message || err.error?.error || 'Não foi possível vincular o pet. Tente novamente.';
        this.notificationService.error('Erro ao vincular', errorMessage);
      }
    });
  }

  desvincularPet(petId: number) {
    this.petToDesvincular.set(petId);
    this.showConfirmModal.set(true);
  }

  confirmarDesvincular() {
    const tutorId = this.selectedTutor()?.id;
    const petId = this.petToDesvincular();
    
    if (!tutorId || !petId) return;

    this.tutorService.desvincularPet(tutorId, petId).subscribe({
      next: () => {
        // console.log('Pet desvinculado com sucesso');
        this.notificationService.success('Pet desvinculado', 'Pet desvinculado do tutor com sucesso!');
        this.showConfirmModal.set(false);
        this.petToDesvincular.set(null);
        // Recarregar detalhes do tutor
        this.openDetails(this.selectedTutor()!);
      },
      error: (err) => {
        // console.error('Erro ao desvincular pet:', err);
        const errorMessage = err.error?.message || err.error?.error || 'Não foi possível desvincular o pet. Tente novamente.';
        this.notificationService.error('Erro ao desvincular', errorMessage);
        this.showConfirmModal.set(false);
        this.petToDesvincular.set(null);
      }
    });
  }

  cancelarDesvincular() {
    this.showConfirmModal.set(false);
    this.petToDesvincular.set(null);
  }

  navigateToPets() {
    this.router.navigate(['/pets']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
