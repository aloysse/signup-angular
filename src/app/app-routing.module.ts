import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { SuccessComponent } from './success/success.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: RegisterComponent },
  { path: 'success', component: SuccessComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }