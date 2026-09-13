import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginResponse, RegisterRequest } from '../models/auth.model';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiurl = environment.apiUrl_Admin;
  //private readonly apiurl = 'https://localhost:7007/Admin';

  private readonly accesstoke = 'access_token';
  private readonly refreshtoken = 'refresh_token';

  constructor(private httpclient: HttpClient) {}

  register(request: RegisterRequest): Observable<any> {
    return this.httpclient.post<any>(`${this.apiurl}/RegisterUser`, request);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    debugger;
    const request = {
      username: username,
      password: password,
    };
    return this.httpclient
      .post<LoginResponse>(`${this.apiurl}/Login`, request)
      .pipe(
        tap((response) => {
          this.savetoken(
            response.userid,
            response.username,
            response.roleid,
            response.email,
            response.token,
            response.refreshtoken,
          );
        }),
      );
  }

  private savetoken(
    userid: number,
    username: string,
    roleid: number,
    email: string,
    token: string,
    refreshtoken: string,
  ): void {
    localStorage.setItem('userid', userid.toString());
    localStorage.setItem('username', username);
    localStorage.setItem('roleid', roleid.toString());
    localStorage.setItem('email', email);
    localStorage.setItem(this.accesstoke, token);
    localStorage.setItem(this.refreshtoken, refreshtoken);
  }

  gettoken(): string | null {
    return localStorage.getItem(this.accesstoke);
  }

  getrefreshtoken(): string | null {
    return localStorage.getItem(this.refreshtoken);
  }

  isauthenticated(): boolean {
    return !!this.gettoken();
  }

  logout(): void {
    localStorage.removeItem(this.accesstoke);
    localStorage.removeItem(this.refreshtoken);
  }
}
