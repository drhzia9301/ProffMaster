-- Add DELETE policy for attempts table
-- This is required for the "Reset Progress" feature to work correctly.

create policy "Users can delete own attempts."
  on attempts for delete
  using ( auth.uid() = user_id );
