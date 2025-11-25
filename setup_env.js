
import fs from 'fs';
const content = `VITE_SUPABASE_URL=https://uijynsrafegtplkngbuq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpanluc3JhZmVndHBsa25nYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTU3MzUsImV4cCI6MjA3OTU3MTczNX0.BzNJdyjgYcrJUdMGvj3mnZ7WNSqtLUkxdF43GL-n3Oo
GEMINI_API_KEY=
`;
fs.writeFileSync('.env.local', content);
console.log('.env.local written successfully');
