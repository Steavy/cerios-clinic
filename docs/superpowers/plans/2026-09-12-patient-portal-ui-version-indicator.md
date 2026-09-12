# Patient Portal UI Version Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a version indicator in the patient portal webapp that displays the active application version at the bottom of the screen using semantic versioning sourced from a build-time environment variable.

**Architecture:** Modify the Layout component to read the version from VITE_APP_VERSION environment variable and display it in the main content area above the portal footer with subtle styling.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS

## Global Constraints

- Version must be displayed at bottom of screen (per user preference)
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Implement for patient portal webapp first
- Use build-time environment variable injection for version sourcing
- Follow existing code patterns and conventions
---
### Task 1: Create environment variable file

**Files:**
- Create: `apps/patient-portal/.env`

**Interfaces:**
- Consumes: None
- Produces: Environment variable file for version configuration

- [ ] **Step 1: Create .env file with default version**

```bash
echo "VITE_APP_VERSION=0.0.0" > apps/patient-portal/.env
```

- [ ] **Step 2: Verify file was created correctly**

Run: `cat apps/patient-portal/.env`
Expected: `VITE_APP_VERSION=0.0.0`

- [ ] **Step 3: Commit the environment variable file**

```bash
git add apps/patient-portal/.env
git commit -m "feat(ui-version): add default environment variable for version tracking"
```

### Task 2: Modify Layout component to display version

**Files:**
- Modify: `apps/patient-portal/src/components/Layout.tsx:157-162`

**Interfaces:**
- Consumes: VITE_APP_VERSION environment variable via import.meta.env
- Produces: Version display in UI

- [ ] **Step 1: Add version display JSX to Layout component**

```diff
{/* Main content */}
 <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
   <Outlet />
+  <div className="text-sm text-gray-300 mt-4 text-center">
+    <span className="font-bold">v{import.meta.env.VITE_APP_VERSION}</span>
+  </div>
 </main>

 <PortalFooter portalName="Patient Portal v2" showLogo={showFooterLogo} />
```

- [ ] **Step 2: Verify the modification is correct**

Run: `grep -A 5 "Version display" apps/patient-portal/src/components/Layout.tsx`
Expected: Should show the added version display code

- [ ] **Step 3: Commit the Layout component changes**

```bash
git add apps/patient-portal/src/components/Layout.tsx
git commit -m "feat(ui-version): add version display to patient portal layout"
```

### Task 3: Test version display locally

**Files:**
- Modify: `apps/patient-portal/.env` (temporary change for testing)

**Interfaces:**
- Consumes: Running development server
- Produces: Visible version in browser UI

- [ ] **Step 1: Update .env with test version**

```bash
echo "VITE_APP_VERSION=1.0.0-test" > apps/patient-portal/.env
```

- [ ] **Step 2: Start development server and verify version appears**

Run: 
```bash
cd apps/patient-portal && pnpm dev &
# Wait for server to start, then check http://localhost:5173
```
Expected: See "v1.0.0-test" displayed at bottom of screen above footer

- [ ] **Step 3: Stop development server and revert .env**

```bash
pkill -f "vite" || true
echo "VITE_APP_VERSION=0.0.0" > apps/patient-portal/.env
```

- [ ] **Step 4: Commit test verification**

```bash
git add apps/patient-portal/.env
git commit -m "test(ui-version): verify version displays correctly in UI"
```

### Task 4: Verify implementation follows coding standards

**Files:**
- Modify: None (verification only)

**Interfaces:**
- Consumes: Existing codebase
- Produces: Confirmation of code quality

- [ ] **Step 1: Run linting to ensure no issues**

Run: `pnpm --filter @clinic/patient-portal lint`
Expected: No linting errors

- [ ] **Step 2: Run typechecking to ensure no type issues**

Run: `pnpm --filter @clinic/patient-portal typecheck`
Expected: No type errors

- [ ] **Step 3: Commit verification results**

```bash
git commit -m "verify(ui-version): confirm implementation passes linting and typechecking"
```

### Task 5: Prepare for production deployment

**Files:**
- Modify: None (documentation only)

**Interfaces:**
- Consumes: CI/CD pipeline documentation
- Produces: Release process documentation update needed

- [ ] **Step 1: Document CI/CD requirement for version injection**

Create documentation note that CI/CD pipeline must:
1. Set VITE_APP_VERSION environment variable during build
2. Use actual release version (e.g., from package.json or git tag)
3. Pass variable to Vite build process

- [ ] **Step 2: Create release process note**

```bash
echo "# Version Release Process

For releasing new versions of the patient portal:

1. Update version in release process (git tag or package.json)
2. CI/CD pipeline should set VITE_APP_VERSION=<actual-version> 
3. Build process injects variable into Vite environment
4. Deployed app displays correct version in UI" > docs/superpowers/release-process-versioning.md
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/superpowers/release-process-versioning.md
git commit -m "docs(ui-version): document release process for version injection"
```

## Success Criteria

- [x] Version visible in patient portal webapp at bottom of screen
- [x] Version follows semantic versioning format
- [x] Version updates correctly when environment variable changes
- [x] No negative impact on existing UI components or functionality
- [x] Implementation follows existing code patterns and conventions

## Open Questions

1. Should the version also be displayed in other portals (doctor, assistant, admin)?
   - Decision: Implement for patient portal first, evaluate for other portals in future work
2. Should we add a tooltip or additional context on hover/click?
   - Decision: Keep initial implementation simple, can enhance later based on user feedback

