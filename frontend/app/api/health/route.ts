export async function GET() {
  try {
    // Check BFF health (port 8000)
    // Try Docker service name first, fallback to localhost
    const urls = [
      'http://bff:8000/api/health',               // Docker service name
      'http://localhost:8000/api/health'          // Local development
    ];
    
    let lastError: Error | null = null;
    
    for (const bffUrl of urls) {
      try {
        const response = await fetch(bffUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`BFF error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return Response.json({
          status: 'healthy',
          service: 'plotweaver-nextjs-frontend',
          bff: data,
          bff_url: bffUrl,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue; // Try next URL
      }
    }
    
    // If we get here, all URLs failed
    throw lastError || new Error('All BFF URLs failed');
  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json(
      { 
        status: 'unhealthy', 
        service: 'plotweaver-nextjs-frontend',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}