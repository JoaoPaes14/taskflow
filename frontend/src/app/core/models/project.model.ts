export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdByName: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  projectRole: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_RESTORED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED';

export interface ProjectActivity {
  id: number;
  projectId: number;
  actorId: number;
  actorName: string;
  action: ActivityAction;
  message: string;
  createdAt: string;
}
