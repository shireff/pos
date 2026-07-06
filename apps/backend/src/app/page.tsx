import { redirect } from 'next/navigation';

export default function BackendIndexPage() {
  redirect('/api/health');
}
