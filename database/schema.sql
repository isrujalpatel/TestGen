-- Create table for storing TestGen sessions
create table history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text not null,
  input_format text,
  output_format text,
  constraints text,
  test_cases jsonb not null, -- Stores edge, base, TLE, complex, hard cases
  solutions jsonb not null   -- Stores solutions in C++, Python, and Java
);