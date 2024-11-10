import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../services/task.service'; 
import { DashboardService } from '../services/dashboard.service'; // Yeni servis
import { Task, TaskComment } from '../models/task.model'; 
import { Project } from '../models/project.model'; 
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  projects: Project[] = []; // Kullanıcının projeleri
  tasksByProject: { [key: number]: Task[] } = {}; // Projeye göre görevler
  usersByProject: { [key: number]: any[] } = {}; // Projeye göre kullanıcılar
  selectedTask: Task | null = null;
  selectedAssigneeByProject: { [key: number]: string } = {};

  // Her proje için ayrı yeni görev nesneleri
  newTaskByProject: { [key: number]: Task } = {};

  constructor(
    private taskService: TaskService, 
    private dashboardService: DashboardService, // Yeni servis
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Status mapping fonksiyonu
  private mapStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
    switch (status.toLowerCase()) {
      case 'todo':
        return 'TODO';
      case 'inprogress':
      case 'in-progress':
        return 'IN_PROGRESS';
      case 'done':
        return 'DONE';
      default:
        throw new Error(`Geçersiz status değeri: ${status}`);
    }
  }

  // Dashboard verilerini yükle
  loadDashboardData(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.projects = data.projects;
        // Projelerin görevlerini yükle ve yeni görev nesnelerini başlat
        this.projects.forEach((project: Project) => {
          this.tasksByProject[project.id] = data.tasks[project.id] || [];
          this.usersByProject[project.id] = project.users || [];
          // Her proje için yeni görev nesnesi başlat
          this.newTaskByProject[project.id] = {
            title: '',
            description: '',
            priority: 'MEDIUM',
            status: 'TODO',
            projectId: project.id,
            assigneeUsername: undefined
          };
          // Seçili assignee başlangıçta boş
          this.selectedAssigneeByProject[project.id] = '';
        });
      },
      error: (error) => {
        console.error('Dashboard verileri yüklenirken bir hata oluştu', error);
        alert('Dashboard verileri yüklenirken bir hata oluştu.');
      }
    });
  }

  // Görev Detayını Açma
  openTaskDetail(task: Task): void {
    this.selectedTask = task;  
  }
  
  closeTaskDetail(): void {
    this.selectedTask = null;  
  }

  // Sürükle-bırak işlemi
  drop(event: CdkDragDrop<Task[]>): void {
    const containerId = event.container.id;
    const [ , projectIdStr, status ] = containerId.split('-'); // Örneğin: project-1-todo
    const projectId = Number(projectIdStr);
    
    if (event.previousContainer === event.container) {
      // Aynı proje içinde sıralama
      moveItemInArray(this.tasksByProject[projectId], event.previousIndex, event.currentIndex);
    } else {
      // Farklı proje veya farklı durum arasında taşıma
      const previousContainerId = event.previousContainer.id;
      const [ , previousProjectIdStr, previousStatus ] = previousContainerId.split('-');
      const previousProjectId = Number(previousProjectIdStr);
      const task = this.tasksByProject[previousProjectId][event.previousIndex];
      
      try {
        // Görevin durumunu doğru enum değerine güncelle
        task.status = this.mapStatus(status);
        // Eğer proje değiştiyse projectId'yi de güncelle
        if (projectId !== previousProjectId) {
          task.projectId = projectId;
        }
      } catch (error) {
        console.error(error);
        alert('Geçersiz görev durumu.');
        return;
      }

      // Backend'de görevi güncelleme
      this.taskService.updateTask(task).subscribe({
        next: (updatedTask) => {
          // Önceki projeden görevi kaldır
          this.tasksByProject[previousProjectId].splice(event.previousIndex, 1);
          // Yeni projeye görevi ekle
          if (!this.tasksByProject[projectId]) {
            this.tasksByProject[projectId] = [];
          }
          this.tasksByProject[projectId].splice(event.currentIndex, 0, updatedTask);
        },
        error: (error) => {
          console.error('Görev durumu güncellenirken bir hata oluştu', error);
          alert('Görev durumu güncellenirken bir hata oluştu.');
          this.loadDashboardData(); // Hatalı durumda yeniden yükle
        }
      });
    }
  }

  // Yeni görev ekleme (Projeye özel)
  addTask(projectId: number): void {
    const taskToAdd = this.newTaskByProject[projectId];

    if (!taskToAdd.title.trim()) {
      alert('Görev başlığı boş olamaz.');
      return;
    }

    if (taskToAdd.projectId === undefined) {
      alert('Geçersiz proje.');
      return;
    }

    // Seçili assignee'yi atayın (opsiyonel)
    taskToAdd.assigneeUsername = this.selectedAssigneeByProject[projectId] || undefined;

    this.taskService.createTask(taskToAdd).subscribe({
      next: (task) => {
        if (task.projectId) {
          if (!this.tasksByProject[task.projectId]) {
            this.tasksByProject[task.projectId] = [];
          }
          this.tasksByProject[task.projectId].push(task);
        }
        // Yeni görev nesnesini sıfırla
        this.newTaskByProject[projectId] = {
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          projectId: projectId,
          assigneeUsername: undefined
        };
        // Seçili assignee'yi sıfırla
        this.selectedAssigneeByProject[projectId] = '';
      },
      error: (error) => {
        console.error('Görev oluşturulurken bir hata oluştu', error);
        alert('Görev oluşturulurken bir hata oluştu.');
      }
    });
  }

  // Görev silme
  deleteTask(task: Task, projectId: number): void {
    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.tasksByProject[projectId] = this.tasksByProject[projectId].filter(t => t.id !== task.id);
        },
        error: (error) => {
          console.error('Görev silinirken bir hata oluştu', error);
          alert('Görev silinirken bir hata oluştu.');
        }
      });
    }
  }
 //task birine assign edildikten sonra taskı güncelle
  onTaskUpdated(updatedTask: Task): void {
    const projectId = updatedTask.projectId!;
    const tasks = this.tasksByProject[projectId];

    if (tasks) {
      const index = tasks.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
    }

    // Eğer seçili görev güncellendiyse, selectedTask değişkenini de güncelle
    if (this.selectedTask && this.selectedTask.id === updatedTask.id) {
      this.selectedTask = updatedTask;
    }
  }

  // Çıkış yapma fonksiyonu
  logout(): void {
    this.authService.logout();
  }
}
