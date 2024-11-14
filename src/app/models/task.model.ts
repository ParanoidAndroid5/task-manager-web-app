export interface Task {
    id?: number;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    username?: string;
    assigneeUsername?: string;
    projectId?: number | null;
  }

  export interface TaskComment {
    id: number;
    taskId: number;
    userId: number;
    content: string;
    username: string;
    createdAt: string;
  }

  export interface TaskHistory {
    id: number;
    timestamp: string;
    fromAssignee: string | null;
    toAssignee: string | null;
    changedBy: string;
    changeType: string;
  }
  