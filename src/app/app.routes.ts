import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { SuccessComponent } from './success/success.component';

export const routes: Routes = [
  { path: '', component: RegisterComponent },
  { path: 'success', component: SuccessComponent }
];
