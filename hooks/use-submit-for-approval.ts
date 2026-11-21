"use client";
import { useState, useCallback } from "react";
import { AdminApiErrorData } from "@/lib/api/admin-client";
import { 
  AdminResponse, 
  getFriendlyErrorMessage, 
  isPendingApproval,
  adminLogger 
} from "@/lib/utils/admin-response-handler";

export interface SubmitState {
  loading: boolean;
  error: string | null;
  pendingApproval: boolean;
  changeRequestId: string | null;
  response: AdminResponse | null;
}

export interface UseSubmitForApprovalOptions {
  onSuccess?: (response: AdminResponse) => void;
  onError?: (error: AdminApiErrorData) => void;
  successMessage?: string;
}

export function useSubmitForApproval(options: UseSubmitForApprovalOptions = {}) {
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: null,
    pendingApproval: false,
    changeRequestId: null,
    response: null,
  });

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      pendingApproval: false,
      changeRequestId: null,
      response: null,
    });
  }, []);

  const submit = useCallback(
    async <T extends AdminResponse>(
      action: () => Promise<T>
    ): Promise<T | null> => {
      setState({
        loading: true,
        error: null,
        pendingApproval: false,
        changeRequestId: null,
        response: null,
      });

      try {
        const response = await action();

        // Check if pending approval
        if (isPendingApproval(response)) {
          setState({
            loading: false,
            error: null,
            pendingApproval: true,
            changeRequestId: response.changeRequestId || null,
            response,
          });
        } else {
          // Direct success
          setState({
            loading: false,
            error: null,
            pendingApproval: false,
            changeRequestId: null,
            response,
          });
          options.onSuccess?.(response);
        }

        return response;
      } catch (err) {
        const error = err as AdminApiErrorData;
        const friendlyMessage = getFriendlyErrorMessage(error);

        setState({
          loading: false,
          error: friendlyMessage,
          pendingApproval: false,
          changeRequestId: null,
          response: null,
        });

        adminLogger.error("Submission failed", error);
        options.onError?.(error);

        return null;
      }
    },
    [options]
  );

  return {
    ...state,
    submit,
    reset,
  };
}
