export async function GET() {
  try {
    // Check FastAPI backend health
    const response = await fetch('http://backend:8000/api/health', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return Response.json({
      status: 'healthy',
      service: 'plotweaver-nextjs-frontend',
      backend: data,
      timestamp: new Date().toISOString(),
    });
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