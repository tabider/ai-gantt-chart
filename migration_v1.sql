-- Add supporting columns for V1 features
alter table tasks 
  add column if not exists parent_id uuid references tasks(id) on delete cascade,
  add column if not exists color text default 'blue';

-- Optional: Create index for performance
create index if not exists tasks_parent_id_idx on tasks(parent_id);
