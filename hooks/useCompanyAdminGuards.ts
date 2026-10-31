import { useEffect, useState } from "react";

/**
 * Stub hook for the in-progress Karibu VMS company-admin guard management.
 * Returns a permissive shape so the dashboard scaffold compiles.
 */
export type GuardPasswordData = {
  id?: string;
  [key: string]: unknown;
};

export type CompanyAdminGuardsResult = {
  data: unknown;
  loading: boolean;
  error: unknown;
};

export function useCompanyAdminGuards(_companyId?: string): CompanyAdminGuardsResult {
  const [state, setState] = useState<CompanyAdminGuardsResult>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ data: null, loading: false, error: null });
  }, [_companyId]);

  return state;
}

export default useCompanyAdminGuards;
