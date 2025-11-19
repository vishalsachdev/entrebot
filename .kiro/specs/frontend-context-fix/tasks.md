# Implementation Plan

- [ ] 1. Fix AuthContext navigation
  - Remove `window.location.href` usage that causes issues
  - Use `useNavigate` hook properly inside AuthProvider
  - Ensure AuthProvider is inside Router context
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Simplify App.tsx context nesting
  - Keep QueryClientProvider → Router → AuthProvider → other contexts order
  - Remove unnecessary nesting levels
  - Test that app loads without hanging
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Test protected routes work correctly
  - Verify login redirects to dashboard
  - Verify logout redirects to login
  - Verify unauthenticated users can't access protected routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Verify all pages load without errors
  - Test Dashboard page
  - Test Projects page
  - Test Agents page
  - Test all other routes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
