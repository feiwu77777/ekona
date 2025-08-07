import MonitoringDashboard from '@/app/components/MonitoringDashboard';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <Button variant="outline">
              ← Go to Home Page
            </Button>
          </Link>
        </div>        
        <MonitoringDashboard />
      </div>
    </div>
  );
}
