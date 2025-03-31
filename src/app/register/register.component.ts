import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { WebviewCommunicationService } from '../services/webview-communication.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private webview: WebviewCommunicationService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      displayName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
    });

    // 🔁 收到 App 的 token 再交給 authService 處理
    this.webview.listenOnceForToken((token, uid) => {
      this.authService.receiveTokenFromApp(token, uid);
    });

    // ➡️ 請求 App 提供登入狀態
    this.webview.requestTokenFromApp();
  }

  onSubmit() {
    if (this.form.invalid) return;

    const { email, password, displayName, phoneNumber } = this.form.value;

    this.authService.register(email, password, displayName, phoneNumber).subscribe({
      error: (err) => {
        this.error = err.message || '註冊失敗';
      }
    });
  }
}
