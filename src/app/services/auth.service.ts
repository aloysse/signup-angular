import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { WebviewCommunicationService } from './webview-communication.service';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private webviewCommunication: WebviewCommunicationService
  ) {}

  /**
   * 接收來自 WebView 的 token 資訊（uid + token）
   */
  receiveTokenFromApp(token: string, uid: string) {
    const userRef = doc(this.firestore, 'users', uid);
    getDoc(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as UserProfile;
        this.userSubject.next(profile);
        this.router.navigate(['/success']);
      } else {
        console.warn('❗查無使用者，導回註冊頁');
        this.router.navigate(['/']);
      }
    }).catch(err => {
      console.error('❌ 無法取得使用者資料:', err);
      this.router.navigate(['/']);
    });
  }

  /**
   * 註冊新帳號，成功後通知 App 儲存登入狀態
   */
  register(email: string, password: string, displayName: string, phoneNumber: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential) => {
        const profile: UserProfile = {
          uid: credential.user.uid,
          email,
          displayName,
          phoneNumber,
        };
        const userRef = doc(this.firestore, 'users', credential.user.uid);

        return from(setDoc(userRef, profile)).pipe(
          switchMap(() => from(credential.user.getIdToken())),
          tap((token) => {
            this.userSubject.next(profile);
            this.webviewCommunication.sendTokenToApp(token, profile); // ✅ 通知 App 儲存
            this.router.navigate(['/success']);
          }),
          switchMap(() => from(Promise.resolve(credential)))
        );
      })
    );
  }

  /**
   * 登出帳號，通知 App 清除本地資料
   */
  logout(): void {
    this.userSubject.next(null);
    this.webviewCommunication.sendLogoutToApp();
    this.router.navigate(['/']);
  }

  /**
   * 取得目前使用者資料（Observable）
   */
  getUserProfile(): Observable<UserProfile | null> {
    return this.user$;
  }
}
