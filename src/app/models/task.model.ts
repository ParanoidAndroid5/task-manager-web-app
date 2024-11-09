export interface Task {
    id?: number;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    username?: string;
    assigneeUsername?: string;
  }

  export interface TaskComment {
    id: number;
    taskId: number;
    userId: number;
    content: string;
    username: string;
    createdAt: string;
  }