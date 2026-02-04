import { Component, signal, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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

  hasMore = computed(() => {
    const result = this.totalPages() === null ? true : (this.page() + 1) < (this.totalPages() as number);
    console.log('hasMore calculado:', result, 'page:', this.page(), 'totalPages:', this.totalPages());
    return result;
  });

  constructor() {
    // debounce search
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
    console.log('PetListComponent: ngOnInit iniciado - BROWSER LOG');
    if (!this.authService.isAuthenticated()) {
      console.log('Tentando fazer login...');
      this.authService.login({ username: 'admin', password: 'admin' }).subscribe({
        next: (response) => {
          console.log('Login ok: ', response);
          this.loadPets();
        },
        error: (err) => {
          console.error('Erro no login:', err);
        }
      });
    } else {
      console.log('Já autenticado, carregar dados ...');
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

    console.log('Fazendo requisição para API:', { page, size: this.size, nome });

    this.petService.list(page, this.size, nome).subscribe({
      next: (res) => {
        console.log("Dados recebidos da API /v1/pets:");
        console.log(JSON.stringify(res, null, 2));
        console.log("Pets carregados:", res.content);

        const current = this.pets();
        this.pets.set([...current, ...res.content]);
        this.totalPages.set(res.pageCount);
        this.loading.set(false);

        console.log("Total pets agora:", this.pets().length, "totalPages:", this.totalPages(), "hasMore:", this.hasMore());
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
    console.log('BOTÃO CARREGAR MAIS CLICADO');
    console.log('loadMore chamado, hasMore:', this.hasMore(), 'loading:', this.loading());
    if (!this.hasMore() || this.loading()) {
      console.log('Retornando sem carregar');
      return;
    }
    this.page.set(this.page() + 1);
    console.log('Nova página:', this.page());
    this.loadPets();
  }

  openDetails(pet: Pet) {
    console.log('Abrindo detalhes para pet:', pet);
    this.selectedPet.set(pet);
    console.log('selectedPet definido:', this.selectedPet());
  }

  closeDetails() {
    console.log('Fechando detalhes');
    this.selectedPet.set(null);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
