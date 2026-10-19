export interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  description?: string;
  project?: string;
  dueDate?: string;
  [key: string]: unknown;
}
