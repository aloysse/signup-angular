## 專案技術概述文件

本文件紀錄本專案的關鍵技術實作與整合方式，主要針對 Firebase 連結、WebView 溝通、token 管理與 router 跳轉流程進行說明，供開發與維護參考。

---

### 1. Firebase 連結設定

本專案使用 Angular + Firebase 結合，並透過 `@angular/fire` 套件整合 Authentication 與 Firestore。

#### 1.1 初始化方式
- 在 `main.ts` 中使用 `bootstrapApplication()` 並搭配：
  ```ts
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore())
  ```
- `environment.firebase` 中填入 Firebase 專案的設定參數。
- 使用 `createUserWithEmailAndPassword` 與 `getIdToken()` 完成註冊與 token 取得。

#### 1.2 儲存使用者資料
- 成功註冊後，會使用 Firestore 儲存使用者 profile（email、name、phone）。

---

### 2. 與 WebView 溝通機制

專案被包裝在 React Native App 中以 `react-native-webview` 嵌入，因此採用 `postMessage` 機制進行雙向資料傳遞。

#### 2.1 Web 端向 App 要求 token
- 在 `RegisterComponent` 中啟動時傳送：
  ```ts
  window.ReactNativeWebView?.postMessage(JSON.stringify({ action: 'getTokenFromApp' }))
  ```

#### 2.2 App 回傳 token 給 Web
- Web 端在 `WebviewCommunicationService` 中監聽 `message`：
  ```ts
  window.addEventListener('message', ...)
  document.addEventListener('message', ...) // Android
  ```
- 接收到 `receiveToken` 事件後，將 token 與 uid 傳入 `AuthService.receiveTokenFromApp(token, uid)` 以進行登入與跳轉。

#### 2.3 傳送 token 給 App
- 使用者註冊成功後，Web 會傳送 token 給 App：
  ```ts
  postMessage({ action: 'registerSuccess', payload: { token, uid } })
  ```

#### 2.4 刪除帳號通知 App
- 登出時傳送：
  ```ts
  postMessage({ action: 'deleteAccount' })
  ```

---

### 3. Token 取得與判斷流程

#### 3.1 初始請求

- Web 在啟動後主動要求 App 傳遞 token：
```ts
this.webview.requestTokenFromApp();
// WebviewCommunicationService 中方法如下：
requestTokenFromApp() {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ action: 'getTokenFromApp' })
  );
}
```
- Web 端同時註冊 listener 以接收回傳：
```ts
this.webview.listenOnceForToken((token, uid) => {
  this.authService.receiveTokenFromApp(token, uid);
});
```
- App 端會使用 WebView 的 postMessage 回傳：
```ts
webviewRef.current.postMessage(
  JSON.stringify({ action: 'receiveToken', payload: { token, uid } })
);
```
#### 3.2 若資料存在

- 呼叫 AuthService.receiveTokenFromApp() 會自動呼叫 Firestore 並更新內部 userSubject，完成登入流程。

---

### 4. Router 跳轉邏輯

#### 4.1 使用 Angular Router 搭配 `Standalone Component`
- 所有 routing 設定集中於 `app.routes.ts`
- `main.ts` 透過 `provideRouter(routes)` 匯入

#### 4.2 登入狀態控制跳轉
- 在收到 token 並驗證成功後，Web 自動導向 `/success`
- 若資料不存在（或驗證失敗），導回 `/`

---

### 5. 額外補充：技術選型與結構優化

- 採用 Angular Standalone Component 架構，精簡模組依賴
- 避免 DI 循環：`WebviewCommunicationService` 不直接注入 `AuthService`
- 所有與 token 相關的邏輯都移出 localStorage，統一透過 WebView 傳遞
- 可相容 React Native App 並支援 iOS/Android 測試

---

如未來加入登入頁、第三方登入、或多端共用登入狀態（如桌機 + App），亦可基於本架構擴充。

