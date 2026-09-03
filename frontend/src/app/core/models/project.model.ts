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
  joinedAt: string;
}
