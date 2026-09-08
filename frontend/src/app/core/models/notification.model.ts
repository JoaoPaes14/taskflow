export interface Notification {
  id: number;
  type: string;
  message: string;
  referenceId?: number;
  referenceType?: string;
  read: boolean;
  createdAt: string;
}
