import { Component, signal, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PetService } from './pet.service';
import { AuthService } from '../../core/services/auth.service';
import { Pet } from '../../shared/models';

@Component({
  selector: 'app-pet-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pet-list.component.html',
  styleUrls: ['./pet-list.component.css']
})
export class PetListComponent implements OnDestroy, OnInit {
  private petService = inject(PetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pets = signal<Pet[]>([]);
  loading = signal(false);
  page = signal(0);
  size = 10;
  totalPages = signal<number | null>(null);
  searchTerm = signal('');

  private search$ = new Subject<string>();
  private sub = new Subscription();

  selectedPet = signal<Pet | null>(null);

  hasMore = computed(() => {
    return this.totalPages() === null ? true : (this.page() + 1) < (this.totalPages() as number);
  });

  constructor() {
    // debounce search
    this.sub.add(
      this.search$.pipe(debounceTime(400)).subscribe(term => {
        this.page.set(0);
        this.pets.set([]);
        this.loadPets();
      })
    );
  }

  ngOnInit() {    
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

  loadPets() {
    if (this.loading()) return;
    this.loading.set(true);

    const page = this.page();
    const nome = this.searchTerm();

    this.petService.list(page, this.size, nome).subscribe({
      next: (res) => {
        const current = this.pets();
        this.pets.set([...current, ...res.content]);
        this.totalPages.set(res.pageCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar pets:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    if (!this.hasMore() || this.loading()) return;
    this.page.set(this.page() + 1);
    this.loadPets();
  }

  openDetails(pet: Pet) {
    this.selectedPet.set(pet);
  }

  closeDetails() {
    this.selectedPet.set(null);
  }

  goToDetailsPage(pet: Pet) {
    this.router.navigate(['/pets', pet.id]);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
