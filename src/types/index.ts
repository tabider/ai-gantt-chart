export type Project = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  is_public: boolean;
};

export type TaskStatus = 'todo' | 'doing' | 'done';

export type TaskColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'gray';

export type Task = {
  id: string;
  project_id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: TaskStatus;
  priority: number;   // 1, 2, 3
  color?: TaskColor;
  parent_id?: string | null;
  progress?: number; // 0-100
  created_at: string;
};

export type Comment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
};
