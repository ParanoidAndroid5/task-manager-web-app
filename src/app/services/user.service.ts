import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { environment } from './environment'; 
import { User } from '../models/user.model'; 

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    if (username && password) {
      return new HttpHeaders({
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      });
    }
    return new HttpHeaders();
  }

  getCurrentUser(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/current`, { headers });
  }

  updateUser(user: User): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.put<User>(`${this.apiUrl}/current`, user, { headers });
  }

  updatePassword(passwords: { currentPassword: string; newPassword: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/current/password`, passwords, { headers });
  }
}
