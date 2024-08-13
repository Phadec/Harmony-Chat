import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ConfirmEmailComponent } from './components/confirm-email/confirm-email.component';
import { FriendsService } from './services/friends.service';
import { AuthInterceptor } from './auth.interceptor';
import {ChatWindowComponent} from "./components/chat-window/chat-window.component";
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { ChatLayoutComponent } from './layouts/chat-layout/chat-layout.component';
import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import { BlockedUsersModalComponent } from './components/blocked-users-modal/blocked-users-modal.component';
import {MatDialogActions, MatDialogContent} from "@angular/material/dialog";
import {MatIcon} from "@angular/material/icon";
import { RecipientInfoComponent } from './components/recipient-info/recipient-info.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    ConfirmEmailComponent,
    ChatWindowComponent,
    SidebarComponent,
    MessageInputComponent,
    ChatLayoutComponent,
    ChatHeaderComponent,
    BlockedUsersModalComponent,
    RecipientInfoComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatDialogActions,
    MatDialogContent,
    MatIcon
  ],
  providers: [
    FriendsService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
