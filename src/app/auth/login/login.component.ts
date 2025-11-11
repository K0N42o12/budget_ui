import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/service/auth.service';
import { ToastService } from '../../shared/service/toast.service';
import { LoadingIndicatorService } from '../../shared/service/loading-indicator.service';
import { finalize } from 'rxjs';
import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonText,
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonIcon
  ]
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly loadingService = inject(LoadingIndicatorService);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    addIcons({ mailOutline, lockClosedOutline });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    this.loadingService.showLoadingIndicator({ message: 'Logging in...' }).subscribe(loading => {
      this.authService.login(email!, password!).pipe(
        finalize(() => loading.dismiss())
      ).subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Login successful');
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          this.toastService.displayWarningToast('Login failed', error);
        }
      });
    });
  }

  forgotPassword(): void {
    this.toastService.displaySuccessToast('Password reset link sent to your email');
  }
}