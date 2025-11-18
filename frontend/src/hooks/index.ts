// Form validation
export { useFormValidation, validationRules } from './useFormValidation';

// Context hooks
export { useAuth } from '../contexts/AuthContext';
export { useProject } from '../contexts/ProjectContext';
export { useAgent } from '../contexts/AgentContext';
export { useProgress } from '../contexts/ProgressContext';

// Utility hooks
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';
export { useToggle } from './useToggle';
export { useSwipe } from './useSwipe';

// Re-export all query hooks
export * from './queries';
