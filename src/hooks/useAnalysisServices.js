import { useServices } from '../state/appHooks.js';

export function useAnalysisServices() {
  const services = useServices();
  if (!services) {
    throw new Error('Services are not available. Ensure AppStateProvider is rendered.');
  }
  return services;
}
