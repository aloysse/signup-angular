import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { UserProfile } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success',
  standalone: true,
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css'],
  imports: [CommonModule] 
})
export class SuccessComponent {
  user$: Observable<UserProfile | null>;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.getUserProfile();
  }

  logout() {
    this.authService.logout();
  }
}
