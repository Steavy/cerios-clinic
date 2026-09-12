import sys

with open('.github/workflows/docker-publish.yml', 'r') as f:
    content = f.read()

# Replace the frontend portals section
old_section = """# Frontend portals
           - image: patient-portal
             dockerfile: infra/docker/Dockerfile.frontend
             build-args: |
               APP_NAME=patient-portal
               VITE_APP_VERSION=0.0.0
           - image: doctor-portal
             dockerfile: infra/docker/Dockerfile.frontend
             build-args: |
               APP_NAME=doctor-portal
               VITE_APP_VERSION=0.0.0
           - image: assistant-portal
             dockerfile: infra/docker/Dockerfile.frontend
             build-args: |
               APP_NAME=assistant-portal
               VITE_APP_VERSION=0.0.0
           - image: admin-portal
             dockerfile: infra/docker/Dockerfile.frontend
             build-args: |
               APP_NAME=admin-portal
               VITE_APP_VERSION=0.0.0"""

new_section = """# Frontend portals
  - image: patient-portal
    dockerfile: infra/docker/Dockerfile.frontend
    build-args: |
      APP_NAME=patient-portal
      VITE_APP_VERSION=0.0.0
  - image: doctor-portal
    dockerfile: infra/docker/Dockerfile.frontend
    build-args: |
      APP_NAME=doctor-portal
      VITE_APP_VERSION=0.0.0
  - image: assistant-portal
    dockerfile: infra/docker/Dockerfile.frontend
    build-args: |
      APP_NAME=assistant-portal
      VITE_APP_VERSION=0.0.0
  - image: admin-portal
    dockerfile: infra/docker/Dockerfile.frontend
    build-args: |
      APP_NAME=admin-portal
      VITE_APP_VERSION=0.0.0"""

# Replace the section
lines = content.split('\n')
# Find and replace the section
new_lines = []
skip_next = 0
for i, line in enumerate(lines):
    if '# Frontend portals' in line:
        # Skip the old section lines
        # Count how many lines the old section takes
        section_lines = 0
        for j in range(i+1, len(lines)):
            if lines[j].startswith('- image:'):
                section_lines += 1
            elif lines[j].strip() == '':
                section_lines += 1
            elif '# Frontend portals' in lines[j+1] if j+1 < len(lines) else False:
                break
            else:
                break
        section_lines += 1  # Include the comment line
        # Skip these lines
        for j in range(i, i + section_lines):
            # Don't add them to new_lines
            pass
        # Add the new section
        new_lines.extend(new_section.split('\n'))
        # Skip the old section lines
        i += section_lines
    else:
        new_lines.append(line)
        i += 1

with open('.github/workflows/docker-publish.yml', 'w') as f:
    f.write('\n'.join(new_lines))
EOF
python3 fix_yaml.py
