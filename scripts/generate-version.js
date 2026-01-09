import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionInfo = {
  version: new Date().getTime().toString(),
  buildDate: new Date().toISOString(),
};

const publicDir = path.resolve(__dirname, '../public');

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Ensure version.json is ignored in git
  const publicGitignorePath = path.join(publicDir, '.gitignore');
  let gitignoreContent = '';
  if (fs.existsSync(publicGitignorePath)) {
    gitignoreContent = fs.readFileSync(publicGitignorePath, 'utf8');
  }

  const hasVersionIgnore = gitignoreContent
    .split('\n')
    .some((line) => line.trim() === 'version.json');

  if (!hasVersionIgnore) {
    const needsNewline =
      gitignoreContent.length > 0 && !gitignoreContent.endsWith('\n');
    const prefix = needsNewline ? '\n' : '';
    fs.writeFileSync(
      publicGitignorePath,
      `${gitignoreContent}${prefix}version.json\n`
    );
    console.log('Added version.json to public/.gitignore');
  }

  fs.writeFileSync(
    path.join(publicDir, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );

  console.log(`Generated version.json: ${versionInfo.version}`);
} catch (error) {
  console.error('Failed to generate version.json:', error);
  process.exit(1);
}
