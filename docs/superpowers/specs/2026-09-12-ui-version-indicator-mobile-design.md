# UI Version Indicator Design

## Date

2026-09-12

## Feature Branch

feature/ui-version-indicator-mobile

## Overview

This document describes the implementation of a version indicator in the Cerios Clinic mobile app (patient-mobile). The version will be displayed at the bottom of the Profile screen using semantic versioning (MAJOR.MINOR.PATCH) sourced from a build-time environment variable.

## Goals

- Display the active application version in the UI
- Use semantic versioning for clear release tracking
- Implement for patient-mobile webapp first
- Use build-time environment variable injection for version sourcing
- Follow existing code patterns and conventions

## Design Details

### Version Source

- A `.env` file will be created in the `apps/patient-mobile` directory containing:
  ```
  APP_VERSION=0.0.0
  ```
- In production, the CI/CD pipeline will set this environment variable during the build process to reflect the actual release version
- During local development, the version defaults to "0.0.0" but can be overridden as needed
- The version will be presented as: `v{MAJOR.MINOR.PATCH}` (e.g., v1.4.0)

### Implementation Approach

#### Environment Variable Setup

- Create `.env` file in `apps/patient-mobile` with default version:

  ```
  APP_VERSION=0.0.0
  ```

- In production, the CI/CD pipeline will set this environment variable during the build process to reflect the actual release version
- During local development, the version defaults to "0.0.0" but can be overridden as needed

### Implementation Approach

#### Mobile App Layout Modification

- Modify `apps/patient-mobile/src/components/Layout.tsx` to:
  1. Read the version from `import.meta.env.APP_VERSION`
  2. Display it in the main content area just before the footer with subtle styling
  3. Apply appropriate styling for subtle visibility

#### Styling

- Text size: `text-sm`
- Color: `text-gray-300` (subtle, non-intrusive)
- Margin: `mt-4` (separation from main content)
- Alignment: `text-center` (centered horizontally)
- Weight: `font-bold` (slight emphasis for readability)

### Component Structure

```jsx
<main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
  <Outlet />
  <div className="text-sm text-gray-300 mt-4 text-center">
    <span className="font-bold">v{import.meta.env.APP_VERSION}</span>
  </div>
</main>

<PortalFooter portalName="Patient Portal" showLogo={showFooterLogo} version={import.meta.env.APP_VERSION} />
```

### Error Handling

- If the environment variable is undefined, the version will display as `vundefined`
- This is acceptable for development environments and makes configuration issues visible
- In production, the CI/CD pipeline ensures the variable is properly set

## Future Considerations

- Mobile app implementation will follow a similar pattern using React Native's build configuration
- Version synchronization between web and mobile apps will be managed through release processes
- Consideration for adding version to API headers for debugging purposes (future work)
