import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ConfirmEmailComponent } from './components/confirm-email/confirm-email.component';
import { FriendsService } from './services/friends.service';
import { AuthInterceptor } from './auth.interceptor';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { ChatLayoutComponent } from './layouts/chat-layout/chat-layout.component';
import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import { BlockedUsersModalComponent } from './components/blocked-users-modal/blocked-users-modal.component';
import { RecipientInfoComponent } from './components/recipient-info/recipient-info.component';
import { ChangeNicknameDialogComponent } from './components/change-nickname-dialog/change-nickname-dialog.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { CreateGroupDialogComponent } from './components/create-group-dialog/create-group-dialog.component';
import { UpdateUserDialogComponent } from './components/update-user-dialog/update-user-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AvatarUploadDialogComponent } from './components/avatar-upload-dialog/avatar-upload-dialog.component';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { ImagePreviewDialogComponent } from './components/image-preview-dialog/image-preview-dialog.component';
import { AttachmentPreviewDialogComponent } from './components/attachment-preview-dialog/attachment-preview-dialog.component';
import { EmojiModule } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import {AddMemberDialogComponent} from "./components/add-member-dialog/add-member-dialog.component";
import {RenameGroupDialogComponent} from "./components/rename-group-dialog/rename-group-dialog.component";
import {PickerComponent} from "@ctrl/ngx-emoji-mart";
import { EmojiPickerComponent } from './components/emoji-picker/emoji-picker.component';
import { CallPopupComponent } from './components/call-popup/call-popup.component';
import { IncomingCallPopupComponent } from './components/incoming-call-popup/incoming-call-popup.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { NoAccessComponent } from './components/no-access/no-access.component';
import { ThemeSelectorDialogComponent } from './components/theme-selector-dialog/theme-selector-dialog.component';
@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ConfirmEmailComponent,
    ChatWindowComponent,
    SidebarComponent,
    MessageInputComponent,
    ChatLayoutComponent,
    ChatHeaderComponent,
    BlockedUsersModalComponent,
    RecipientInfoComponent,
    ChangeNicknameDialogComponent,
    ConfirmDialogComponent,
    CreateGroupDialogComponent,
    UpdateUserDialogComponent,
    AvatarUploadDialogComponent,
    ChangePasswordDialogComponent,
    ImagePreviewDialogComponent,
    AttachmentPreviewDialogComponent,
    AddMemberDialogComponent,
    RenameGroupDialogComponent,
    EmojiPickerComponent,
    CallPopupComponent,
    IncomingCallPopupComponent,
    AdminLayoutComponent,
    NoAccessComponent,
    ThemeSelectorDialogComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule, // Để sử dụng mat-form-field, mat-label
    MatInputModule,     // Để sử dụng matInput
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,      // Để sử dụng mat-selection-list, mat-list-option
    MatIconModule,      // Để sử dụng mat-icon
    EmojiModule,
    PickerComponent,
    // Để sử dụng emoji-mart
  ],
  providers: [
    FriendsService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Thêm dòng này
  bootstrap: [AppComponent]
})
export class AppModule { }
