import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskComment } from '../models/task.model';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent {
  @Input() task: Task | null = null;
  @Output() closeDetail = new EventEmitter<void>();

  newComment: string = '';
  comments: TaskComment[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    if (this.task) {
      this.loadComments();
    }
  }

  close(): void {
    this.closeDetail.emit();
  }

  loadComments(): void {
    if (this.task?.id != null) {
      this.taskService.getComments(this.task.id!).subscribe({
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
      this.taskService.addComment(this.task.id!, { content: this.newComment.trim() }).subscribe({
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
}
