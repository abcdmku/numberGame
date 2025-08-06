import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Get current commit SHA (fallback if git is not available)
let commitSha = 'unknown';
try {
  commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  console.log('Git not available, using fallback SHA');
  // Generate a pseudo-random SHA for environments without git
  commitSha = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get package.json version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Update version.ts file
const versionContent = `// Version information
// This file is auto-generated during build
export const VERSION_INFO = {
  sha: '${commitSha}',
  version: '${version}',
  buildDate: '${new Date().toISOString().split('T')[0]}'
};

export const getVersionString = () => {
  return \`v\${VERSION_INFO.version} (\${VERSION_INFO.sha.substring(0, 7)})\`;
};

export const getFullVersionInfo = () => {
  return \`\${getVersionString()} - Built \${VERSION_INFO.buildDate}\`;
};
`;

fs.writeFileSync('src/version.ts', versionContent);
console.log(`Version updated: v${version} (${commitSha.substring(0, 7)})`);