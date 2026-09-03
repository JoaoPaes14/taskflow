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
