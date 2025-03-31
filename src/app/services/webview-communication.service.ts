import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebviewCommunicationService {
  constructor(private ngZone: NgZone) {}

  listenOnceForToken(callback: (token: string, uid: string) => void) {
    const listener = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.action === 'receiveToken') {
          const { token, uid } = data.payload;
          if (token && uid) {
            this.ngZone.run(() => {
              callback(token, uid); // ✅ 呼叫外部提供的處理邏輯
            });
          }
        }
      } catch (err) {
        console.error('❌ WebView 資料錯誤', err);
      }
    };

    window.addEventListener('message', listener);
    document.addEventListener('message', listener as EventListener);
  }

  sendTokenToApp(token: string, profile: any) {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        action: 'registerSuccess',
        payload: { token, uid: profile.uid }
      })
    );
  }

  sendLogoutToApp() {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ action: 'deleteAccount' })
    );
  }

  requestTokenFromApp() {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ action: 'getTokenFromApp' })
    );
  }
}
