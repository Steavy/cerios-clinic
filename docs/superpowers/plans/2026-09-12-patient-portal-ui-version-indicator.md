# Patient Portal UI Version Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a version indicator in all Cerios Clinic portal webapps (patient, doctor, assistant, admin) that displays the active application version inside the existing shared footer at the bottom of the screen using semantic versioning sourced from a build-time environment variable.

**Architecture:** Extend the shared `PortalFooter` component (`packages/portal-common`) with an optional `version` prop, then pass `import.meta.env.VITE_APP_VERSION` from each portal's Layout component into `<PortalFooter version={...} />`.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS

## Global Constraints

- Version must be displayed at bottom of screen (per user preference)
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Implement for all portal webapps (patient, doctor, assistant, admin)
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

### Task 2: Add version prop to shared PortalFooter

**Files:**

- Modify: `packages/portal-common/src/portal-footer.tsx`

**Interfaces:**

- Consumes: Version string prop
- Produces: Version displayed in existing footer text

- [ ] **Step 1: Add optional `version` prop to PortalFooter**

```diff
 export interface PortalFooterProps {
   portalName: string;
   showLogo?: boolean;
+  version?: string;
 }
```

- [ ] **Step 2: Render version in footer text**

```diff
-<span>
-  {portalName} &copy; {year}
-</span>
+<span>
+  {portalName} &copy; {year}
+  {version ? ` v${version}` : ""}
+</span>
```

- [ ] **Step 3: Add tests for the version prop**

Modify `packages/portal-common/src/__tests__/portal-footer.test.tsx` to cover rendering with and without a version.

### Task 3: Pass version from each portal Layout to PortalFooter

**Files:**

- Modify: `apps/patient-portal/src/components/Layout.tsx`
- Modify: `apps/doctor-portal/src/components/Layout.tsx`
- Modify: `apps/assistant-portal/src/components/AppLayout.tsx`
- Modify: `apps/admin-portal/src/components/Layout.tsx`

**Interfaces:**

- Consumes: VITE_APP_VERSION environment variable via import.meta.env
- Produces: Version display in existing footer

- [ ] **Step 1: Add version prop to PortalFooter usage in each layout**

```diff
-<PortalFooter portalName="Patient Portal v2" showLogo={showFooterLogo} />
+<PortalFooter portalName="Patient Portal v2" showLogo={showFooterLogo} version={import.meta.env.VITE_APP_VERSION} />
```

Rendered result: `Patient Portal v2 © 2026 v0.0.0`

- [ ] **Step 2: Verify the modification is correct**

Run: `grep -rn "version={import.meta.env.VITE_APP_VERSION}" apps/*/src`
Expected: Four matches (one per portal layout)

- [ ] **Step 3: Commit the changes**

```bash
git add packages/portal-common/src apps/*/src/components
git commit -m "feat(ui-version): show version inside shared portal footer"
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

- [x] Version visible in all portal webapps inside the existing footer at bottom of screen
- [x] Version follows semantic versioning format
- [x] Version updates correctly when environment variable changes
- [x] No negative impact on existing UI components or functionality
- [x] Implementation follows existing code patterns and conventions

## Open Questions

1. Should the mobile app also show its version?
   - Decision: Implement for portal webapps first, evaluate for mobile in future work
2. Should we add a tooltip or additional context on hover/click?
   - Decision: Keep initial implementation simple, can enhance later based on user feedback
