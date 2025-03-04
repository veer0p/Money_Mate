import { Routes } from '@angular/router';
import { SignUpComponent } from './sign-up/sign-up.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';
import { ConfirmPasswordComponent } from './confirm-password/confirm-password.component'; // ✅ New Component
import { ChatComponent } from './chat/chat.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './home/home.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'otp-verification', component: OtpVerificationComponent },
  { path: 'confirm-password', component: ConfirmPasswordComponent }, // ✅ New Route
  { path: 'chat', component: ChatComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' },
];
