import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskComment } from '../models/task.model';
import { environment } from './environment'; 

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = `${environment.apiUrl}/tasks`;

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

  getTasks(): Observable<Task[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Task[]>(`${this.apiUrl}`, { headers });
  }

  getTasksByProject(projectId: number): Observable<Task[]> { // Yeni metod
    const headers = this.getAuthHeaders();
    return this.http.get<Task[]>(`${this.apiUrl}/project/${projectId}`, { headers });
  }

  createTask(task: Task): Observable<Task> {
    const headers = this.getAuthHeaders();
    return this.http.post<Task>(`${this.apiUrl}`, task, { headers });
  }

  updateTask(task: Task): Observable<Task> {
    const headers = this.getAuthHeaders();
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task, { headers });
  }

  deleteTask(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  addComment(taskId: number, content: { content: string }): Observable<TaskComment> {
    const headers = this.getAuthHeaders();
    return this.http.post<TaskComment>(`${this.apiUrl}/${taskId}/comments`, content, { headers });
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TaskComment[]>(`${this.apiUrl}/${taskId}/comments`, { headers });
  }
}
