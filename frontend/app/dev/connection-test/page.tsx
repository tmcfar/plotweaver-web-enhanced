'use client';

import { useState, useEffect } from 'react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'healthy' | 'unhealthy' | 'error';
  responseTime?: number;
  details?: any;
  error?: string;
}

export default function ConnectionTestPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Frontend Health', url: '/api/health', status: 'checking' },
    { name: 'BFF Health', url: '/api/bff/api/health', status: 'checking' },
    { name: 'BFF Root Info', url: '/api/bff/', status: 'checking' },
    { name: 'Backend Health', url: '/api/backend/health', status: 'checking' },
    { name: 'GitHub OAuth Authorize', url: 'http://localhost:5000/api/v1/auth/oauth/github/authorize?redirect_uri=http://localhost:3000/github/callback', status: 'checking' },
  ]);

  const testService = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      console.log(`Testing ${service.name} at ${service.url}`);
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`${service.name} response:`, response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${service.name} data:`, data);
        return {
          ...service,
          status: 'healthy',
          responseTime,
          details: data,
        };
      } else {
        const errorText = await response.text().catch(() => 'Could not read error text');
        console.log(`${service.name} error:`, response.status, response.statusText, errorText);
        return {
          ...service,
          status: 'unhealthy',
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`${service.name} exception:`, error);
      return {
        ...service,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const runTests = async () => {
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })));
    
    const promises = services.map(service => testService(service));
    const results = await Promise.all(promises);
    
    setServices(results);
  };

  useEffect(() => {
    runTests();
  }, [runTests]);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'unhealthy': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'checking': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '⚠️';
      case 'error': return '❌';
      case 'checking': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PlotWeaver Service Connection Test
        </h1>
        <p className="text-gray-600">
          Testing connectivity between Frontend (localhost:3000), BFF (localhost:8000), and Backend (localhost:5000)
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Refresh Tests
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(service.status)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">{service.url}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {service.responseTime && (
                  <span className="text-sm text-gray-600">
                    {service.responseTime}ms
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}
                >
                  {service.status}
                </span>
              </div>
            </div>

            {service.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-1">Error:</h4>
                <p className="text-sm text-red-700">{service.error}</p>
              </div>
            )}

            {service.details && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(service.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting Notes</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>Frontend Health:</strong> Tests the Next.js app health endpoint. Should always be healthy if the app is running.
          </div>
          <div>
            <strong>BFF Health:</strong> Tests FastAPI BFF service via Next.js proxy (/api/bff/*). Requires BFF running on localhost:8000.
          </div>
          <div>
            <strong>Backend Health:</strong> Tests main backend service via Next.js proxy (/api/backend/*). Requires backend running on localhost:5000.
          </div>
          <div>
            <strong>GitHub OAuth:</strong> Tests authentication provider endpoints. May fail if authentication is disabled in development.
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <strong>CORS Note:</strong> All external service calls are proxied through Next.js rewrites in next.config.mjs to avoid CORS issues.
          </div>
        </div>
      </div>
    </div>
  );
}