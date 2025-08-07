'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface EditHistoryProps {
  history: Array<{
    id: string;
    request: string;
    timestamp: Date;
    contentSnapshot: string;
  }>;
  onRestore: (content: string) => void;
}

export default function EditHistory({ history, onRestore }: EditHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit History ({history.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Edit History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No edit history yet. Make some edits to see them here.
            </p>
          ) : (
            history.map((edit) => (
              <div key={edit.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{edit.request}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRestore(edit.contentSnapshot);
                      setIsOpen(false);
                    }}
                  >
                    Restore
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {edit.timestamp.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
