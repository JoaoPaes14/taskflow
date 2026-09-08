export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskLabel {
  id: number;
  projectId: number;
  name: string;
  color: string;
}

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

export interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  position: number;
  archived?: boolean;
  assigneeId?: number;
  assigneeName?: string;
  createdById: number;
  createdByName: string;
  labels?: TaskLabel[];
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number;
  labelIds?: number[];
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  position?: number;
}

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TaskCommentRequest {
  content: string;
}
