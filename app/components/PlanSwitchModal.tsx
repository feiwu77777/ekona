'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

interface PlanSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  currentBillingCycle: string;
  newBillingCycle: string;
  isLoading?: boolean;
}

export default function PlanSwitchModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  currentBillingCycle,
  newBillingCycle,
  isLoading = false,
}: PlanSwitchModalProps) {
  const isSameTier = currentPlan === newPlan;
  const isBillingCycleChange = currentBillingCycle !== newBillingCycle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Plan Change</DialogTitle>
          <DialogDescription>
            {isSameTier && isBillingCycleChange ? (
              <>
                You're switching from <strong>{currentPlan} ({currentBillingCycle})</strong> to{' '}
                <strong>{newPlan} ({newBillingCycle})</strong>.
              </>
            ) : (
              <>
                You're switching from <strong>{currentPlan} ({currentBillingCycle})</strong> to{' '}
                <strong>{newPlan} ({newBillingCycle})</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What happens next:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Your existing billing information will be used</li>
              <li>• You'll be charged a prorated amount for the remaining period</li>
              <li>• Your credits will be updated to match the new plan</li>
              <li>• The change takes effect immediately</li>
            </ul>
          </div>

          {isBillingCycleChange && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-1">Billing Cycle Change</h4>
              <p className="text-sm text-blue-800">
                Switching from {currentBillingCycle} to {newBillingCycle} billing will adjust your 
                next billing date and credit allocation accordingly.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 