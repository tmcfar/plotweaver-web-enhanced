// Temporary debug patch for UserProfileImplementation.tsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/profile/UserProfileImplementation.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add debug logging if not already present
if (!content.includes('=== OAuth Debug Info ===')) {
  const searchStr = 'const redirectUri = `${window.location.origin}/(auth)/github/callback`;';
  const replacement = `const redirectUri = \`\${window.location.origin}/(auth)/github/callback\`;
      
      // DEBUG: Log what we're about to send
      console.log('=== OAuth Debug Info ===');
      console.log('Redirect URI:', redirectUri);
      console.log('Backend URL:', backendUrl);
      console.log('Full request URL:', \`\${backendUrl}/api/v1/auth/oauth/github/authorize?redirect_uri=\${encodeURIComponent(redirectUri)}\`);
      console.log('Env var NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT:', process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT);
      console.log('Window origin:', window.location.origin);
      console.log('=======================');`;
  
  content = content.replace(searchStr, replacement);
  fs.writeFileSync(filePath, content);
  console.log('Debug logging added to UserProfileImplementation.tsx');
}
