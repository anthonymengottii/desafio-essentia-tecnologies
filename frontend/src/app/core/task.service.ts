import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Task, TaskInput, TaskStatus } from './models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly base = `${API_URL}/tasks`;

  constructor(private http: HttpClient) {}

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.base}/${id}`);
  }

  create(input: TaskInput): Observable<Task> {
    return this.http.post<Task>(this.base, input);
  }

  update(id: number, input: Partial<TaskInput>): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, input);
  }

  setStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}/status`, { status });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
