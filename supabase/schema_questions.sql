-- Create a table for questions
create table questions (
  id text primary key,
  subject text not null,
  topic text,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  correct_index integer,
  explanation text,
  difficulty text default 'Medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index questions_subject_idx on questions(subject);
create index questions_topic_idx on questions(topic);

-- Enable RLS (Row Level Security)
alter table questions enable row level security;

-- Allow everyone to read questions (public access)
create policy "Questions are viewable by everyone."
  on questions for select
  using ( true );

-- Only authenticated users can insert/update (for admin purposes)
create policy "Only authenticated users can insert questions."
  on questions for insert
  with check ( auth.role() = 'authenticated' );

create policy "Only authenticated users can update questions."
  on questions for update
  using ( auth.role() = 'authenticated' );
