// import { Injectable } from '@angular/core';
// import { StringeeClient, StringeeChat } from "stringee-chat-js-sdk;
// @Injectable({
//   providedIn: 'root'
// })
// export class StringeeService {
//   private stringeeClient: any;
//
//   constructor() {
//     this.initStringeeClient();
//   }
//
//   private initStringeeClient(): void {
//     try {
//       this.stringeeClient = new StringeeClient();
//
//       this.stringeeClient.on('connect', () => {
//         console.log('Connected to Stringee');
//       });
//
//       this.stringeeClient.on('authen', (res: any) => {
//         console.log('Authenticated with Stringee', res);
//       });
//
//       this.stringeeClient.on('disconnect', () => {
//         console.log('Disconnected from Stringee');
//       });
//
//       this.stringeeClient.on('authenerror', (res: any) => {
//         console.error('Authentication error:', res);
//       });
//
//     } catch (error) {
//       console.error('Failed to initialize StringeeClient:', error);
//     }
//   }
//
//   connect(accessToken: string): void {
//     if (this.stringeeClient) {
//       this.stringeeClient.connect(accessToken);
//     } else {
//       console.error('StringeeClient is not initialized.');
//     }
//   }
//
//   getClient(): any {
//     return this.stringeeClient;
//   }
// }
