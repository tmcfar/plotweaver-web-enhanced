// Test the Foundation Checkpoint component
cd /home/tmcfar/dev/pw-web/frontend

# Add to your app/page.tsx or wherever you want to test
import { FoundationCheckpoint } from '../src/components/advanced/FoundationCheckpoint';

// Usage:
<FoundationCheckpoint 
  projectId="test-project"
  onCheckpointCreate={() => console.log('Checkpoint created')}
  onComponentLock={(ids, level) => console.log('Locking:', ids, level)}
/>

# Test the component
npm run dev