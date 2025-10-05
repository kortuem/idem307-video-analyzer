import { useServices } from '../state/AppStateProvider.jsx';

export function useAnalysisServices() {
  const services = useServices();
  if (!services) {
    throw new Error('Services are not available. Ensure AppStateProvider is rendered.');
  }
  return services;
}
