import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-white">
        <FileText className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">FormBuilder</h1>
        <p className="text-gray-500 max-w-sm">
          Create beautiful, customizable forms with drag-and-drop ease. Share them anywhere.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/forms/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Form
        </Button>
        <Button variant="outline" onClick={() => navigate('/forms')}>
          View All Forms
        </Button>
      </div>
    </div>
  );
}
