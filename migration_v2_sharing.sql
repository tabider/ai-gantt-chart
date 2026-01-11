-- Add is_public column to projects
alter table projects add column is_public boolean default false;

-- Update RLS Policies for Projects to allow public read
create policy "Allow public read access to projects"
  on projects for select
  using (is_public = true);

-- Update RLS Policies for Tasks to allow public read if project is public
create policy "Allow public read access to tasks"
  on tasks for select
  using (
    project_id in (
      select id from projects where is_public = true
    )
  );
