import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;

  isLoading = signal(false);
  errorMsg = signal('');
  passwordResetDialog = signal(false);
  registerDialog = signal(false);
  submitForgotPasswordLoading = signal(false);
  registerFormIsLoading = signal(false);
  isMusicPlaying = signal(false);

  @ViewChild('loginMusic') loginMusic?: ElementRef<HTMLAudioElement>;

  constructor() {
    this.loginForm = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.minLength(3), Validators.email],
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: [
          '',
          [Validators.required, Validators.minLength(3), Validators.email],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    this.forgotPasswordForm = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.minLength(3), Validators.email],
      ],
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  submitLogin(): void {
    if (!this.loginForm.valid) {
      return;
    }

    this.errorMsg.set('');
    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.results.token) {
          this.authStore.login(response.results);
          this.router.navigate(['/home']);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMsg.set(
          error?.error?.message || error?.message || 'Login failed'
        );
        this.isLoading.set(false);
      },
    });
  }

  submitForgotPassword(): void {
    if (!this.forgotPasswordForm.valid) {
      return;
    }

    this.submitForgotPasswordLoading.set(true);
    this.authService
      .forgotPassword(this.forgotPasswordForm.value.email)
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Success! Check your email for password reset instructions.',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
          this.submitForgotPasswordLoading.set(false);
          this.passwordResetDialog.set(false);
        },
        error: () => {
          this.submitForgotPasswordLoading.set(false);
        },
      });
  }

  submitRegister(): void {
    if (!this.registerForm.valid) {
      return;
    }

    const firstName = this.registerForm.get('firstName')?.value?.trim() || '';
    const lastName = this.registerForm.get('lastName')?.value?.trim() || '';
    const email = this.registerForm.get('email')?.value?.trim() || '';
    const password = this.registerForm.get('password')?.value || '';
    const confirmPassword =
      this.registerForm.get('confirmPassword')?.value || '';
    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      c_password: confirmPassword,
    };

    this.registerFormIsLoading.set(true);
    this.authService.register(payload).subscribe({
      next: () => {
        this.snackBar.open('Success! Registration complete.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.registerFormIsLoading.set(false);
        this.registerDialog.set(false);
      },
      error: () => {
        this.snackBar.open('Error! Registration failed.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
        this.registerFormIsLoading.set(false);
      },
    });
  }

  async toggleMusic(): Promise<void> {
    const audioElement = this.loginMusic?.nativeElement;
    if (!audioElement) {
      return;
    }

    if (this.isMusicPlaying()) {
      audioElement.pause();
      this.isMusicPlaying.set(false);
      return;
    }

    try {
      if (audioElement.readyState === 0) {
        audioElement.load();
      }
      audioElement.muted = false;
      audioElement.volume = 1;
      await audioElement.play();
    } catch (error) {
      this.snackBar.open(
        'Unable to play this audio file in your browser.',
        'Close',
        {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      console.error('Unable to start login music', error);
    }
  }

  handleMusicError(): void {
    this.snackBar.open('Audio file failed to load or decode.', 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy(): void {
    const audioElement = this.loginMusic?.nativeElement;
    if (!audioElement) {
      return;
    }
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}
