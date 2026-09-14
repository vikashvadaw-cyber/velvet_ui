import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  //private readonly apiurl = environment.apiUrl_Admin;
  private readonly apiurl = 'https://localhost:7279/Admin';

  constructor(private http: HttpClient) {}

  GetMenus(): Observable<any> {
    return this.http.get<any>(`${this.apiurl}/GetMenus`);
  }
}
