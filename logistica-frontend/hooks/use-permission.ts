import { useAuthStore } from '@/stores/auth.store';

export function usePermission(model: string) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  return {
    canView: hasPermission(`view_${model}`),
    canAdd: hasPermission(`add_${model}`),
    canChange: hasPermission(`change_${model}`),
    canDelete: hasPermission(`delete_${model}`),
  };
}
