import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ConfirmEmailComponent } from './components/confirm-email/confirm-email.component';
import { FriendListComponent } from './components/friend-list/friend-list.component';
import { AddFriendComponent } from './components/add-friend/add-friend.component';
import { BlockedUsersComponent } from './components/blocked-users/blocked-users.component';
import { FriendsService } from './services/friends.service';
import { AuthInterceptor } from './auth.interceptor';
import { FriendRequestsComponent } from './components/friend-requests/friend-requests.component';
import { ChatDetailComponent } from './components/chat-detail/chat-detail.component';
import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import { GroupListComponent } from './components/group-list/group-list.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    ConfirmEmailComponent,
    FriendListComponent,
    AddFriendComponent,
    BlockedUsersComponent,
    FriendRequestsComponent,
    ChatDetailComponent,
    ChatHeaderComponent,
    GroupListComponent,
    GroupDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    FriendsService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
