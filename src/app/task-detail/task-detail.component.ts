import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Task, TaskComment } from '../models/task.model';
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

  constructor(private taskService: TaskService, private dashboardService: DashboardService) {}

  ngOnInit(): void {
    if (this.task) {
      this.loadComments();
      this.loadProjectUsers();
      this.selectedAssignee = this.task.assigneeUsername || '';
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
    // Projeye dahil olan kullanıcıları al
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
      },
      error: (error) => {
        console.error('Görev atanan kişiyi güncelleme yetkiniz yoktur.', error);
        alert('Görev atanan kişiyi güncelleme yetkiniz yoktur.');
      }
    });
  }
}
