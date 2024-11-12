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
  filteredTasksByProject: { [key: number]: Task[] } = {};
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
          this.filteredTasksByProject[project.id] = [...this.tasksByProject[project.id]];
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
      if (this.selectedUserFilter) {
        this.filteredTasksByProject[this.selectedProjectId] = tasks.filter(
          task => task.assigneeUsername === this.selectedUserFilter
        );
      } else {
        this.filteredTasksByProject[this.selectedProjectId] = [...tasks];
      }
    }
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = task;  
  }
  
  closeTaskDetail(): void {
    this.selectedTask = null;  
  }

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

  drop(event: CdkDragDrop<Task[]>): void {
    const containerId = event.container.id;
    const [ , projectIdStr, status ] = containerId.split('-');
    const projectId = Number(projectIdStr);
    
    if (event.previousContainer === event.container) {
      // Aynı liste içinde sıralama değişti
    } else {
      const previousContainerId = event.previousContainer.id;
      const [ , previousProjectIdStr ] = previousContainerId.split('-');
      const previousProjectId = Number(previousProjectIdStr);
      const task = this.tasksByProject[previousProjectId].find((_, idx) => idx === event.previousIndex);
      
      if (task) {
        try {
          task.status = this.mapStatus(status);
          if (projectId !== previousProjectId) {
            task.projectId = projectId;
          }
        } catch (error) {
          console.error(error);
          alert('Geçersiz görev durumu.');
          return;
        }

        this.taskService.updateTask(task).subscribe({
          next: (updatedTask) => {
            this.tasksByProject[previousProjectId] = this.tasksByProject[previousProjectId].filter(t => t.id !== task.id);
            if (!this.tasksByProject[projectId]) {
              this.tasksByProject[projectId] = [];
            }
            this.tasksByProject[projectId].push(updatedTask);
            this.applyTaskFilter();
          },
          error: (error) => {
            console.error('Görev durumu güncellenirken bir hata oluştu', error);
            alert('Görev durumu güncellenirken bir hata oluştu.');
            this.loadDashboardData(this.selectedProjectId!);
          }
        });
      }
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
