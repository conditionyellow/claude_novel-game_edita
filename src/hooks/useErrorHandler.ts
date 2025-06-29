/**
 * エラーハンドリングフック
 * 統一されたエラー処理とユーザー通知
 */

import { useState, useCallback } from 'react';
import type { OperationResult } from '../types';

interface ErrorState {
  error: string | null;
  isLoading: boolean;
}

export interface UseErrorHandlerReturn {
  error: string | null;
  isLoading: boolean;
  clearError: () => void;
  handleAsync: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      showAlert?: boolean;
    }
  ) => Promise<OperationResult<T>>;
  handleOperationResult: <T>(
    result: OperationResult<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      showAlert?: boolean;
    }
  ) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [state, setState] = useState<ErrorState>({
    error: null,
    isLoading: false,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      showAlert?: boolean;
    } = {}
  ): Promise<OperationResult<T>> => {
    const { onSuccess, onError, showAlert = true } = options;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await asyncFn();
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (onSuccess) {
        onSuccess(data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      if (showAlert) {
        alert(`エラー: ${errorMessage}`);
      }

      if (onError && error instanceof Error) {
        onError(error);
      }

      console.error('Async operation failed:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const handleOperationResult = useCallback(<T>(
    result: OperationResult<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      showAlert?: boolean;
    } = {}
  ) => {
    const { onSuccess, onError, showAlert = true } = options;

    if (result.success && result.data) {
      setState(prev => ({ ...prev, error: null }));
      
      if (onSuccess) {
        onSuccess(result.data);
      }
    } else if (result.error) {
      setState(prev => ({ ...prev, error: result.error! }));
      
      if (showAlert) {
        alert(`エラー: ${result.error}`);
      }

      if (onError) {
        onError(result.error);
      }

      console.error('Operation failed:', result.error);
    }
  }, []);

  return {
    error: state.error,
    isLoading: state.isLoading,
    clearError,
    handleAsync,
    handleOperationResult,
  };
};