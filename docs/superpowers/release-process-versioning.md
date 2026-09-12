# Version Release Process

For releasing new versions of the patient portal:

1. Update version in release process (git tag or package.json)
2. CI/CD pipeline should set VITE_APP_VERSION=<actual-version> 
3. Build process injects variable into Vite environment
4. Deployed app displays correct version in UI
