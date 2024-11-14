import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Task, TaskComment, TaskHistory } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { DashboardService } from '../services/dashboard.service';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  @Input() task!: Task;
  @Output() closeDetail = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<Task>();

  newComment: string = '';
  comments: TaskComment[] = [];
  projectUsers: any[] = [];
  selectedAssignee: string = '';

  taskHistory: TaskHistory[] = [];
  loadingHistory: boolean = false;
  errorLoadingHistory: boolean = false;

  historyTypeDescriptions: { [key: string]: string } = {// bu ksıım backendten dönen changeType ı stirnge dönüştürmek için yazıldı.
    ASSIGNEE_CHANGED: 'Atanan Kişi Değiştirildi',
    STATUS_UPDATED: 'Durum Güncellendi',
    TASK_CREATED: 'Görev Oluşturuldu',
  };

  getHistoryDescription(type: string): string {
    return this.historyTypeDescriptions[type] || type;
  }
  constructor(private taskService: TaskService, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    if (this.task) {
      this.loadComments();
      this.loadProjectUsers();
      this.selectedAssignee = this.task.assigneeUsername || '';
      this.loadTaskHistory(); 
    }
  }

  close(): void {
    this.closeDetail.emit();
  }

  loadComments(): void {
    if (this.task?.id != null) {
      this.taskService.getComments(this.task.id).subscribe({
        next: (comments) => {
          this.comments = comments;
        },
        error: (error) => {
          console.error('Yorumlar yüklenirken bir hata oluştu', error);
        }
      });
    }
  }

  // Yorum ekle
  addComment(): void {
    if (this.newComment.trim() && this.task?.id != null) {
      this.taskService.addComment(this.task.id, { content: this.newComment.trim() }).subscribe({
        next: (comment) => {
          this.comments.push(comment);
          this.newComment = '';
        },
        error: (error) => {
          console.error('Yorum eklenirken bir hata oluştu', error);
          alert('Yorum eklenirken bir hata oluştu.');
        }
      });
    } else {
      alert("Yorum boş olamaz.");
    }
  }

  loadProjectUsers(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        const project = data.projects.find((p: Project) => p.id === this.task.projectId);
        if (project) {
          this.projectUsers = project.users;
        }
      },
      error: (error) => {
        console.error('Proje kullanıcıları yüklenirken bir hata oluştu', error);
      }
    });
  }

  updateAssignee(): void {
    const updatedTask = { ...this.task, assigneeUsername: this.selectedAssignee };

    this.taskService.updateTask(updatedTask).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        alert('Görev atanan kişi başarıyla güncellendi.');
        this.taskUpdated.emit(updatedTask); 
        this.loadTaskHistory();
      },
      error: (error) => {
        console.error('Görev atanan kişiyi güncelleme yetkiniz yoktur.', error);
        alert('Görev atanan kişiyi güncelleme yetkiniz yoktur.');
      }
    });
  }

  loadTaskHistory(): void {
    if (this.task?.id != null) {
      this.loadingHistory = true;
      this.errorLoadingHistory = false;

      this.taskService.getTaskHistory(this.task.id).subscribe({
        next: (history) => {
          this.taskHistory = history;
          this.loadingHistory = false;
        },
        error: (error) => {
          console.error('Görev geçmişi yüklenirken bir hata oluştu', error);
          this.errorLoadingHistory = true;
          this.loadingHistory = false;
        }
      });
    }
  }
}
