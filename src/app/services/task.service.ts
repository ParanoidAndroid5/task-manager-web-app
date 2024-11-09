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
    const username = sessionStorage.getItem('username') || '';
    const params = new HttpParams().set('username', username);
    return this.http.get<Task[]>(`${this.apiUrl}`, { headers, params });
  }

  createTask(task: Task): Observable<Task> {
    const headers = this.getAuthHeaders();
    const username = sessionStorage.getItem('username') || '';
    console.log('createTask username:', username); // Debug için
    const params = new HttpParams().set('username', username);
    return this.http.post<Task>(`${this.apiUrl}`, task, { headers, params });
  }

  updateTask(task: Task): Observable<Task> {
    const headers = this.getAuthHeaders();
    const username = sessionStorage.getItem('username') || '';
    const params = new HttpParams().set('username', username);
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task, { headers, params });
  }

  deleteTask(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    const username = sessionStorage.getItem('username') || '';
    const params = new HttpParams().set('username', username);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers, params });
  }
  addComment(taskId: number, content: { content: string }): Observable<TaskComment> {
    const headers = this.getAuthHeaders();
    const username = sessionStorage.getItem('username') || '';
    const params = new HttpParams().set('username', username);
    return this.http.post<TaskComment>(`${this.apiUrl}/${taskId}/comments`, content, { headers, params });
}

    getComments(taskId: number): Observable<TaskComment[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TaskComment[]>(`${this.apiUrl}/${taskId}/comments`, { headers });
    }
}