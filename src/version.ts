// Version information
// Update this when deploying new versions
export const VERSION_INFO = {
  sha: 'abc123f', // Replace with actual commit SHA during build
  version: '1.0.0',
  buildDate: new Date().toISOString().split('T')[0]
};

export const getVersionString = () => {
  return `v${VERSION_INFO.version} (${VERSION_INFO.sha.substring(0, 7)})`;
};

export const getFullVersionInfo = () => {
  return `${getVersionString()} - Built ${VERSION_INFO.buildDate}`;
};