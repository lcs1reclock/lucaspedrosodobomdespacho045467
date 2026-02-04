import { Routes } from '@angular/router';
import { PetListComponent } from './features/pets/pet-list.component';
import { TutorListComponent } from './features/tutores/tutor-list.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'auth/login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'pets', component: PetListComponent, canActivate: [authGuard] },
  { path: 'tutores', component: TutorListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
