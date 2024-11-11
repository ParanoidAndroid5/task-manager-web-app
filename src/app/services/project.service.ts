import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';
import { environment } from './environment'; 

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private apiUrl = `${environment.apiUrl}/projects`;

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

  getProjects(): Observable<Project[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Project[]>(this.apiUrl, { headers });
  }

  createProject(project: Project): Observable<Project> {
    const headers = this.getAuthHeaders();
    return this.http.post<Project>(this.apiUrl, project, { headers });
  }

  updateProject(project: Project): Observable<Project> {
    const headers = this.getAuthHeaders();
    return this.http.put<Project>(`${this.apiUrl}/${project.id}`, project, { headers });
  }

  deleteProject(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  
}
