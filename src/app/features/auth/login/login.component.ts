import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HotToastService } from '@ngneat/hot-toast';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.services';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../../../core/models/auth.model';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  mode = signal<'login' | 'register'>('login');
  showSuccessModal = signal(false);
  showSuccessModal2 = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  private successSound = new Audio('assets/sounds/success.wav');
  private registerSound = new Audio('assets/sounds/register.wav');

  posterSeeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // demo placeholders — swap for real poster art

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  registerForm = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authservice: AuthService,
    private toaster: HotToastService,
  ) {}

  switchMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onLoginSubmit(): void {
    debugger;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    const body: LoginRequest = {
      username: this.loginForm.value.username!,
      password: this.loginForm.value.password!,
    };

    this.authservice.login(body.username, body.password).subscribe({
      next: (res) => {
        console.log(res);
        this.isLoading.set(false);
        this.showSuccessModal.set(true);
        this.successSound.play().catch(() => {});
        setTimeout(() => this.router.navigate(['/home']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ??
            "Couldn't sign you in. Check your email and password.",
        );
      },
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, email, password } = this.registerForm.value;
    const body: RegisterRequest = {
      userId: 0,
      userName: username!,
      email: email!,
      password: password!,
      roleId: 1,
      isActive: true,
      createdOn: new Date(),
      updatedOn: null,
      lastLogin: null,
      refreshToken: null,
      refreshTokenExpiry: null,
    };

    this.authservice.register(body).subscribe({
      next: (res) => {
        if (res == true) {
          this.toaster.success('User Created Successfully');
          this.isLoading.set(false);
          // alert('User Created Sucessfully');
          this.showSuccessModal2.set(true);
          this.registerSound.play().catch(() => {});
          setTimeout(() => this.showSuccessModal2.set(false), 2000);

          this.mode.set('login');
        } else {
          this.toaster.warning('Something went wrong!');
          alert('Something went wrong');
          this.isLoading.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ?? "Couldn't create your account. Try again.",
        );
        this.toaster.error(err.error);
      },
    });

    // this.http.post<auth>(`${this.apiUrl}/register`, body).subscribe({
    //   next: res => {
    //     localStorage.setItem('accessToken', res.accessToken);
    //     localStorage.setItem('refreshToken', res.refreshToken);
    //     this.isLoading.set(false);
    //     this.router.navigate(['/browse']);
    //   },
    //   error: (err: HttpErrorResponse) => {
    //     this.isLoading.set(false);
    //     this.errorMessage.set(err.error?.message ?? "Couldn't create your account. Try again.");
    //   }
    // });
  }
}
