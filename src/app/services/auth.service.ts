import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from './environment'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`; 

  constructor(private http: HttpClient, private router: Router) { }

  register(username: string, email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { username, email, password };
    return this.http.post(`${this.apiUrl}/register`, body, { headers });
  }

  login(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { username, password };
    return this.http.post(`${this.apiUrl}/login`, body, { headers }).pipe(
      tap(response => {
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);
        console.log('Kullanıcı giriş yaptı:', username); // Debug için
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('username') !== null && sessionStorage.getItem('password') !== null;
  }
}
