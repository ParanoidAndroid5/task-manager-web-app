import { Component, OnInit } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskService } from '../services/task.service'; 
import { DashboardService } from '../services/dashboard.service'; 
import { Task } from '../models/task.model'; 
import { Project } from '../models/project.model'; 
import { AuthService } from '../services/auth.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  projects: Project[] = [];
  selectedProjectId: number | null = null;
  tasksByProject: { [key: number]: Task[] } = {}; 
  filteredTasksByProject: { [key: number]: { TODO: Task[]; IN_PROGRESS: Task[]; DONE: Task[] } } = {};
  usersByProject: { [key: number]: any[] } = {};
  selectedTask: Task | null = null;
  selectedAssigneeByProject: { [key: number]: string } = {};
  newTaskByProject: { [key: number]: Task } = {};
  selectedUserFilter: string | null = null;

  currentUser: string = '';
  userMenuOpen: boolean = false;
  
  constructor(
    private taskService: TaskService, 
    private dashboardService: DashboardService, 
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const projectId = sessionStorage.getItem('selectedProjectId');
    this.selectedProjectId = projectId ? +projectId : null;
    if (this.selectedProjectId) {
      this.loadDashboardData(this.selectedProjectId);
    }
    this.currentUser = this.authService.getCurrentUsername();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadDashboardData(projectId: number): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        const project = data.projects.find((p: Project) => p.id === projectId);
        if (project) {
          this.projects = [project];
          this.tasksByProject[project.id] = data.tasks[project.id] || [];
          this.filteredTasksByProject[project.id] = {
            TODO: this.tasksByProject[project.id].filter(task => task.status === 'TODO'),
            IN_PROGRESS: this.tasksByProject[project.id].filter(task => task.status === 'IN_PROGRESS'),
            DONE: this.tasksByProject[project.id].filter(task => task.status === 'DONE')
          };
          this.usersByProject[project.id] = project.users || [];
          this.newTaskByProject[project.id] = {
            title: '',
            description: '',
            priority: 'MEDIUM',
            status: 'TODO',
            projectId: project.id,
            assigneeUsername: undefined
          };
          this.selectedAssigneeByProject[project.id] = '';
        }
      },
      error: (error) => {
        console.error('Dashboard verileri yüklenirken bir hata oluştu', error);
        alert('Dashboard verileri yüklenirken bir hata oluştu.');
      }
    });
  }

  filterByUser(username: string | null): void {
    if (this.selectedUserFilter === username) {
      this.selectedUserFilter = null;
    } else {
      this.selectedUserFilter = username;
    }
    this.applyTaskFilter();
  }

  private applyTaskFilter(): void {
    if (this.selectedProjectId) {
      const tasks = this.tasksByProject[this.selectedProjectId];
      this.filteredTasksByProject[this.selectedProjectId] = {
        TODO: tasks.filter(task => task.status === 'TODO' && (!this.selectedUserFilter || task.assigneeUsername === this.selectedUserFilter)),
        IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS' && (!this.selectedUserFilter || task.assigneeUsername === this.selectedUserFilter)),
        DONE: tasks.filter(task => task.status === 'DONE' && (!this.selectedUserFilter || task.assigneeUsername === this.selectedUserFilter))
      };
    }
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = task;  
  }
  
  closeTaskDetail(): void {
    this.selectedTask = null;  
  }

  private mapStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
    switch (status.toUpperCase()) {
      case 'TODO':
        return 'TODO';
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      case 'DONE':
        return 'DONE';
      default:
        throw new Error(`Geçersiz status değeri: ${status}`);
    }
  }

  drop(event: CdkDragDrop<Task[]>): void {
    const containerId = event.container.id;
    const previousContainerId = event.previousContainer.id;

    // ID formatı: "project-{projectId}-{STATUS}"
    const [ , projectIdStr, status ] = containerId.split('-');
    const projectId = Number(projectIdStr);
    const newStatus = this.mapStatus(status);

    const [ , previousProjectIdStr, previousStatus ] = previousContainerId.split('-');
    const previousProjectId = Number(previousProjectIdStr);
    const previousStatusMapped = this.mapStatus(previousStatus);

    if (previousProjectId !== projectId) {
      console.error('Farklı projeler arası sürükleme desteklenmiyor.');
      alert('Farklı projeler arası sürükleme desteklenmiyor.');
      return;
    }

    const task = this.filteredTasksByProject[projectId][previousStatusMapped][event.previousIndex];

    if (task) {
      task.status = newStatus;

      this.taskService.updateTask(task).subscribe({
        next: (updatedTask) => {
          // Eski listeden kaldır
          this.filteredTasksByProject[projectId][previousStatusMapped].splice(event.previousIndex, 1);
          // Yeni listeye ekle
          this.filteredTasksByProject[projectId][newStatus].splice(event.currentIndex, 0, updatedTask);
          // Güncel görev listesine de yansıt
          const taskIndex = this.tasksByProject[projectId].findIndex(t => t.id === task.id);
          if (taskIndex > -1) {
            this.tasksByProject[projectId][taskIndex] = updatedTask;
          }
        },
        error: (error) => {
          console.error('Görev durumu güncellenirken bir hata oluştu', error);
          alert('Görev durumu güncellenirken bir hata oluştu.');
          this.loadDashboardData(this.selectedProjectId!);
        }
      });
    }
  }

  addTask(projectId: number): void {
    const taskToAdd = this.newTaskByProject[projectId];

    if (!taskToAdd.title.trim()) {
      alert('Görev başlığı boş olamaz.');
      return;
    }

    taskToAdd.assigneeUsername = this.selectedAssigneeByProject[projectId] || undefined;

    this.taskService.createTask(taskToAdd).subscribe({
      next: (task) => {
        if (task.projectId) {
          if (!this.tasksByProject[task.projectId]) {
            this.tasksByProject[task.projectId] = [];
          }
          this.tasksByProject[task.projectId].push(task);
          // Filtre uygulanmış ise filtrelemeyi yeniden yap
          this.applyTaskFilter();
        }
        this.newTaskByProject[projectId] = {
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          projectId: projectId,
          assigneeUsername: undefined
        };
        this.selectedAssigneeByProject[projectId] = '';
      },
      error: (error) => {
        console.error('Görev oluşturulurken bir hata oluştu', error);
        alert('Görev oluşturulurken bir hata oluştu.');
      }
    });
  }

  deleteTask(task: Task, projectId: number): void {
    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.tasksByProject[projectId] = this.tasksByProject[projectId].filter(t => t.id !== task.id);
          this.applyTaskFilter();
        },
        error: (error) => {
          console.error('Görev silinirken bir hata oluştu', error);
          alert('Görev silinirken bir hata oluştu.');
        }
      });
    }
  }

  onTaskUpdated(updatedTask: Task): void {
    const projectId = updatedTask.projectId!;
    const tasks = this.tasksByProject[projectId];

    if (tasks) {
      const index = tasks.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
    }

    if (this.selectedTask && this.selectedTask.id === updatedTask.id) {
      this.selectedTask = updatedTask;
    }

    this.applyTaskFilter();
  }
}
