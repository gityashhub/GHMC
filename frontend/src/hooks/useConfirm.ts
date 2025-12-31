import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    options: null,
    onConfirm: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        onConfirm: () => {
          setConfirmState({ isOpen: false, options: null, onConfirm: null });
          resolve(true);
        },
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmState({ isOpen: false, options: null, onConfirm: null });
  }, []);

  const ConfirmDialogComponent = confirmState.options ? (
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      onClose={handleCancel}
      onConfirm={confirmState.onConfirm || handleCancel}
      title={confirmState.options.title}
      description={confirmState.options.description}
      confirmText={confirmState.options.confirmText}
      cancelText={confirmState.options.cancelText}
      variant={confirmState.options.variant}
    />
  ) : null;

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

