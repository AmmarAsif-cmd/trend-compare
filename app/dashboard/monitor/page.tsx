/**
 * Monitor Page
 * Redirects to alerts page since alerts and monitoring are combined
 */

import { redirect } from 'next/navigation';

export default function MonitorPage() {
  redirect('/dashboard/alerts');
}

