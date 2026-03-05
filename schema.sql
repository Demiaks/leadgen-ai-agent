-- Create landings table for storing generated landing pages
create table landings (
  id text primary key,
  html text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table landings enable row level security;

-- Create policy to allow public read access to landings
create policy "Public landings are viewable by everyone"
  on landings for select
  using ( true );

-- Create policy to allow authenticated users (service role) to insert/update/delete
create policy "Service role can manage landings"
  on landings for all
  using ( auth.role() = 'service_role' );
