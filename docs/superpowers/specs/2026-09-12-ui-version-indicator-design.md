# UI Version Indicator Design

## Date

2026-09-12

## Feature Branch

feature/ui-version-indicator

## Overview

This document describes the implementation of a version indicator in the Cerios Clinic portal webapps. The version will be displayed at the bottom of the screen inside the existing shared footer (`PortalFooter`) using semantic versioning (MAJOR.MINOR.PATCH) sourced from a build-time environment variable.

## Goals

- Display the active application version in the UI
- Use semantic versioning for clear release tracking
- Implement for all portal webapps (patient, doctor, assistant, admin)
- Use build-time environment variable injection for version sourcing

## Design Details

### Version Source

- A `.env` file will be created in the `apps/patient-portal` directory containing:
  ```
  VITE_APP_VERSION=0.0.0
  ```
- In production, the CI/CD pipeline will set this environment variable during the build process to reflect the actual release version.
- During local development, the version defaults to "0.0.0" but can be overridden as needed.

### Version Display Location

- The version will be displayed inside the existing shared footer (`PortalFooter`), next to the `{portalName} © {year}` text.
- This placement was selected based on user preference for bottom-screen visibility and to avoid an extra visual element above the footer.
- The version will be presented as: `v{MAJOR.MINOR.PATCH}` (e.g., v1.4.0)

### Implementation Approach

#### PortalFooter Modification

- Add an optional `version?: string` prop to `PortalFooter` in `packages/portal-common/src/portal-footer.tsx`.
- When provided, the footer renders `{portalName} © {year} v{version}`.
- When omitted, the footer renders exactly as before (backwards compatible).

#### Portal Layout Modifications

- Modify each portal layout to pass the version to `PortalFooter`:
  1. `apps/patient-portal/src/components/Layout.tsx`
  2. `apps/doctor-portal/src/components/Layout.tsx`
  3. `apps/assistant-portal/src/components/AppLayout.tsx`
  4. `apps/admin-portal/src/components/Layout.tsx`
- Each reads the version from `import.meta.env.VITE_APP_VERSION` and passes it as the `version` prop.

#### Styling

- The version reuses the existing footer styling (`text-sm`, `text-white`, centered). No new styles are added.

### Component Structure

```jsx
<PortalFooter portalName="Patient Portal v2" showLogo={showFooterLogo} version={import.meta.env.VITE_APP_VERSION} />
```

Renders: `Patient Portal v2 © 2026 v0.0.0`

### Error Handling

- If the environment variable is undefined, the footer still renders correctly (the `version` prop shows only when provided); a missing value results in no version being displayed.
- In production, the CI/CD pipeline ensures the variable is properly set.

### Future Considerations

- Mobile app implementation will follow a similar pattern using React Native's build configuration
- Version synchronization between web and mobile apps will be managed through release processes
- Consideration for adding version to API headers for debugging purposes (future work)

## Dependencies

- None beyond existing project setup (Vite, React, TypeScript)

## Risks & Mitigations

| Risk                               | Mitigation                                                 |
| ---------------------------------- | ---------------------------------------------------------- |
| Version not updating in production | CI/CD pipeline will inject correct version during build    |
| Version display breaking layout    | Version reuses existing footer styling, no layout changes  |
| Environment variable leakage       | Variable contains only version information, no secrets     |

## Success Criteria

- [ ] Version visible in all portal webapps inside the existing footer at bottom of screen
- [ ] Version follows semantic versioning format
- [ ] Version updates correctly when environment variable changes
- [ ] No negative impact on existing UI components or functionality
- [ ] Implementation follows existing code patterns and conventions

## Open Questions

1. Should the mobile app also show its version?
   - Decision: Implement for portal webapps first, evaluate for mobile in future work
2. Should we add a tooltip or additional context on hover/click?
   - Decision: Keep initial implementation simple, can enhance later based on user feedback
