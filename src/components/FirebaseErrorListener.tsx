'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export const FirebaseErrorListener: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: error.message || 'An unexpected database error occurred.',
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
};
