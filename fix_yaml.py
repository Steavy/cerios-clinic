import re

with open('.github/workflows/docker-publish.yml', 'r') as f:
    content = f.read()

# Fix the build-args content indentation
# The pattern is: lines with "VITE_APP_VERSION" or "APP_NAME=" should have 16 spaces
lines = content.split('\n')
new_lines = []
in_build_args_block = False

for line in lines:
    # Track if we're in a build-args block (after a line ending with "|")
    if line.rstrip().endswith('build-args: |'):
        in_build_args_block = True
    elif line.strip() == '' or (not line.startswith('               ') and not line.startswith('            ') and not line.startswith('          ')):
        # End of build-args block if we hit a non-indented line
        if not line.startswith('              ') and not line.startswith('            ') and not line.startswith('          - image:'):
            in_build_args_block = False
    
    if in_build_args_block:
        # Fix lines that have APP_NAME or VITE_APP_VERSION
        if line.strip().startswith('APP_NAME=') or line.strip().startswith('VITE_APP_VERSION='):
            if line.startswith(' ' * 12) and not line.startswith(' ' * 16):
                line = ' ' * 16 + line.lstrip()
        elif line.strip().startswith('build-args: |'):
            in_build_args_block = True
    
    # Also fix the - image: lines indentation
    if line.strip().startswith('- image:') and line.startswith('           '):
        line = line.replace('           -', '          -')
    
    # Fix dockerfile indentation
    if 'dockerfile: infra/docker/Dockerfile.frontend' in line and line.startswith('             '):
        line = line.replace('             ', '            ')
    
    # Fix build-args: | indentation
    if 'build-args: |' in line and line.startswith('             '):
        line = line.replace('             ', '            ')
    
    print(line)

