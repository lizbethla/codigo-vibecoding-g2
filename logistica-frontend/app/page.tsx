import { redirect } from 'next/navigation';

// Root path — redirect into the dashboard.
// The (dashboard)/layout.tsx guard will redirect to /login if not authenticated.
export default function RootPage() {
  redirect('/dashboard');
}
