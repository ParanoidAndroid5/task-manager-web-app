import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../services/task.service'; 
import { Task } from '../models/task.model'; 
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  todo: Task[] = [];
  inProgress: Task[] = [];
  done: Task[] = [];

  newTask: Task = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO'
  };

  constructor(private taskService: TaskService, private authService: AuthService) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  // Görevleri yükle
  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.todo = tasks.filter(task => task.status === 'TODO');
        this.inProgress = tasks.filter(task => task.status === 'IN_PROGRESS');
        this.done = tasks.filter(task => task.status === 'DONE');
      },
      error: (error) => {
        console.error('Görevler yüklenirken bir hata oluştu', error);
        alert('Görevler yüklenirken bir hata oluştu.');
      }
    });
  }

  // Sürükle-bırak işlemi
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Aynı sütun içinde sıralama
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Farklı sütunlar arasında taşıma
      const task = event.previousContainer.data[event.previousIndex];
      
      // Görevin durumunu güncelle
      if (event.container.id === 'todoList') {
        task.status = 'TODO';
      } else if (event.container.id === 'inProgressList') {
        task.status = 'IN_PROGRESS';
      } else if (event.container.id === 'doneList') {
        task.status = 'DONE';
      }

      // Backend'de görevi güncelleme
      this.taskService.updateTask(task).subscribe({
        next: () => {
          // Görevi yeni listeye taşı
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        },
        error: (error) => {
          console.error('Error updating task status', error);
          alert('Görev durumu güncellenirken bir hata oluştu.');
          this.loadTasks();
        }
      });
    }
  }

  // Yeni görev ekleme
  addTask(): void {
    if (!this.newTask.title.trim()) {
      alert('Görev başlığı boş olamaz.');
      return;
    }

    this.taskService.createTask(this.newTask).subscribe({
      next: (task) => {
        this.todo.push(task);
        this.newTask = { title: '', description: '', priority: 'MEDIUM', status: 'TODO' };
      },
      error: (error) => {
        console.error('Error creating task', error);
        alert('Görev oluşturulurken bir hata oluştu.');
      }
    });
  }

  // Görev silme
  deleteTask(task: Task): void {
    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          // Görevi ilgili listeden kaldır
          this.todo = this.todo.filter(t => t.id !== task.id);
          this.inProgress = this.inProgress.filter(t => t.id !== task.id);
          this.done = this.done.filter(t => t.id !== task.id);
        },
        error: (error) => {
          console.error('Error deleting task', error);
          alert('Görev silinirken bir hata oluştu.');
        }
      });
    }
  }

  // Çıkış yapma fonksiyonu
  logout(): void {
    this.authService.logout();
  }
}
