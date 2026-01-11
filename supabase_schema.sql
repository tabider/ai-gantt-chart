-- Create tables
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- For MVP, assuming single user or handled by simple auth, but schema should support auth.uid()
  name text not null,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  status text check (status in ('todo', 'doing', 'done')) default 'todo',
  priority int check (priority in (1, 2, 3)) default 2,
  created_at timestamptz default now()
);

-- Enable RLS
alter table projects enable row level security;
alter table tasks enable row level security;

-- Policies (For MVP, we might want to be permissive or link to auth.uid())
-- Since requirement says "Single user assumed (Email+Password)", we will assume Supabase Auth is used.

-- Allow authenticated users to manage their own projects
create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to manage tasks in their projects
create policy "Users can manage tasks in their projects"
  on tasks for all
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

-- Function to handle new user (optional, but good for linking)
-- For this MVP, we rely on the client sending the project creation with user_id, 
-- or we can default user_id to auth.uid() via trigger, but client-side logic is easier for MVP.
