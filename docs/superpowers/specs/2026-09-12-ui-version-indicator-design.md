# UI Version Indicator Design

## Date
2026-09-12

## Feature Branch
feature/ui-version-indicator

## Overview
This document describes the implementation of a version indicator in the Cerios Clinic patient portal webapp. The version will be displayed at the bottom of the screen using semantic versioning (MAJOR.MINOR.PATCH) sourced from a build-time environment variable.

## Goals
- Display the active application version in the UI
- Use semantic versioning for clear release tracking
- Implement initially for the patient portal webapp
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
- The version will be displayed at the bottom of the screen, above the existing portal footer.
- This placement was selected based on user preference for bottom-screen visibility.
- The version will be presented as: `v{MAJOR.MINOR.PATCH}` (e.g., v1.4.0)

### Implementation Approach
#### Patient Portal Layout Modification
- Modify `apps/patient-portal/src/components/Layout.tsx` to:
  1. Read the version from `import.meta.env.VITE_APP_VERSION`
  2. Display it in the main content area just before the footer
  3. Apply appropriate styling for subtle visibility

#### Styling
- Text size: `text-sm`
- Color: `text-gray-300` (subtle, non-intrusive)
- Margin: `mt-4` (separation from main content)
- Alignment: `text-center` (centered horizontally)
- Weight: `font-bold` (slight emphasis for readability)

### Component Structure
```jsx
{/* Main content */}
<main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <Outlet />
  <div className="text-sm text-gray-300 mt-4 text-center">
    <span className="font-bold">v{import.meta.env.VITE_APP_VERSION}</span>
  </div>
</main>

<PortalFooter portalName="Patient Portal v2" showLogo={showFooterLogo} />
```

### Error Handling
- If the environment variable is undefined, the version will display as `vundefined`
- This is acceptable for development environments and makes configuration issues visible
- In production, the CI/CD pipeline ensures the variable is properly set

### Future Considerations
- Mobile app implementation will follow a similar pattern using React Native's build configuration
- Version synchronization between web and mobile apps will be managed through release processes
- Consideration for adding version to API headers for debugging purposes (future work)

## Dependencies
- None beyond existing project setup (Vite, React, TypeScript)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Version not updating in production | CI/CD pipeline will inject correct version during build |
| Version display breaking layout | Subtle styling and placement above footer minimizes impact |
| Environment variable leakage | Variable contains only version information, no secrets |

## Success Criteria
- [ ] Version visible in patient portal webapp at bottom of screen
- [ ] Version follows semantic versioning format
- [ ] Version updates correctly when environment variable changes
- [ ] No negative impact on existing UI components or functionality
- [ ] Implementation follows existing code patterns and conventions

## Open Questions
1. Should the version also be displayed in other portals (doctor, assistant, admin)?
   - Decision: Implement for patient portal first, evaluate for other portals in future work
2. Should we add a tooltip or additional context on hover/click?
   - Decision: Keep initial implementation simple, can enhance later based on user feedback