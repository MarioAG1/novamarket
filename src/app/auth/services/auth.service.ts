import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { User } from '@auth/interfaces/user.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    stream: () => this.checkStatus(),
  });

  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') {
      return 'checking';
    }

    if (this._user()) {
      return 'authenticated';
    }

    return 'not-authenticated';
  });

  user = computed(() => this._user());
  token = computed(() => this._token());

  login(email: string, password: string): Observable<boolean> {
    // Si se pone {} despues de la flecha hay que poner el return, en el tap da lo mismo
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth/login`, {
        email: email,
        password: password,
      })
      .pipe(
        map((resp) => {
          return this.handleLoginSuccess(resp);
        }),
        catchError((error: any) => {
          return this.handleLoginError(error);
        }),
      );
  }

  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.logout();
      return of(false);
    }

    // Si se pone {} despues de la flecha hay que poner el return, en el tap da lo mismo
    return this.http
      .get<AuthResponse>(`${baseUrl}/auth/check-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        map((resp) => {
          return this.handleLoginSuccess(resp);
        }),
        catchError((error: any) => {
          return this.handleLoginError(error);
        }),
      );
  }

  logout() {
    this._authStatus.set('not-authenticated');
    this._user.set(null);
    this._token.set(null);

    localStorage.removeItem('token');
  }

  // Se podria poner en vez de resp, {user, token} para destructurarlo
  private handleLoginSuccess(resp: AuthResponse) {
    this._user.set(resp.user);
    this._authStatus.set('authenticated');
    this._token.set(resp.token);

    localStorage.setItem('token', resp.token);

    return true;
  }

  private handleLoginError(error: any) {
    this.logout();
    return of(false);
  }
}
