import { Routes } from '@angular/router';
import { PetListComponent } from './features/pets/pet-list.component';
import { TutorListComponent } from './features/tutores/tutor-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/pets', pathMatch: 'full' },
  { path: 'pets', component: PetListComponent },
  { path: 'tutores', component: TutorListComponent },
];
