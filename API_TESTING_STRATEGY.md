# API Integration Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the PlotWeaver frontend-backend API integration. The strategy covers unit tests, integration tests, end-to-end tests, and performance testing to ensure robust and reliable API communication.

## Testing Pyramid

```
         /\
        /E2E\        <- End-to-End Tests (10%)
       /------\
      /  Integ  \    <- Integration Tests (30%)
     /------------\
    /   Unit Tests  \ <- Unit Tests (60%)
   /-----------------\
```

## Testing Tools & Frameworks

### Frontend Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: E2E testing
- **Jest-Extended**: Additional matchers

### Backend Testing
- **pytest**: Python testing framework
- **pytest-asyncio**: Async test support
- **httpx**: Async HTTP client for testing
- **Faker**: Test data generation
- **pytest-cov**: Coverage reporting

### Performance Testing
- **k6**: Load testing
- **Lighthouse**: Frontend performance
- **pytest-benchmark**: Backend benchmarking

### AI & CLI Tooling
- **Claude CLI**: AI assistant for code generation and analysis
- **Swagger MCP (`swagger`)**: Tool for querying loaded OpenAPI/Swagger specifications
- **Swagger-Loader MCP (`swagger-loader`)**: Tool for loading API specifications into the AI's context

## API Specification and Model-Assisted Testing

To enhance testing efficiency and ensure consistency, we adopt a contract-driven approach using OpenAPI/Swagger specifications, integrated with AI-assisted tooling. This strategy centralizes the API definition, enabling automated and accurate test generation.

### Core Components
- **OpenAPI/Swagger Specification**: A `swagger.yml` or `openapi.json` file serves as the single source of truth for all API endpoints, schemas, and operations. This file lives alongside the source code.
- **Claude CLI with MCPs**: We leverage the Claude CLI with specialized Model Context Protocols (MCPs) to interact with our API specification directly from the command line.
  - **`swagger-loader`**: This MCP loads the API specification into the model's context, making it aware of our entire API surface.
  - **`swagger`**: This MCP allows for querying and interacting with the loaded specification.

### Workflow for AI-Assisted Test Generation

This workflow empowers developers to rapidly generate robust tests that are perfectly aligned with the API contract.

1.  **Load the API Spec**: The developer uses the `swagger-loader` MCP to load the project's OpenAPI specification into the Claude CLI session.
    ```bash
    claude> /load swagger-loader path/to/your/openapi.yml
    ```

2.  **Query the Spec (Optional)**: The developer can inspect endpoints to understand parameters, schemas, and responses.
    ```bash
    claude> /swagger get /api/v1/feedback
    ```

3.  **Generate Tests**: The developer prompts the AI to generate tests for a specific endpoint, leveraging the loaded context. The AI uses its knowledge of the contract and best practices to create comprehensive tests.

    **Example Prompt:**
    > "Using the loaded Swagger specification for the `POST /api/v1/feedback` endpoint, generate a complete `pytest` test file. The test should cover the success case for an authenticated user, a case for an anonymous user, and a validation error case where required fields are missing. Ensure the test uses `fastapi.testclient.TestClient` and follows the patterns in our existing test suite."

This approach significantly reduces the manual effort required to write and maintain API tests, improves test accuracy by tying tests directly to the specification, and ensures new or modified endpoints get immediate test coverage.

## Unit Testing Strategy

### Frontend Unit Tests

#### API Client Tests
```typescript
// __tests__/services/api/client.test.ts
import { ApiClient } from '@/services/api/client';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ApiClient', () => {
  let client: ApiClient;
  
  beforeEach(() => {
    client = new ApiClient();
  });
  
  describe('request method', () => {
    it('should add authentication header when token exists', async () => {
      const mockToken = 'test-token';
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);
      
      server.use(
        rest.get('/api/v1/test', (req, res, ctx) => {
          expect(req.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
          return res(ctx.json({ success: true }));
        })
      );
      
      await client.get('/test');
    });
    
    it('should handle 401 errors by refreshing token', async () => {
      let callCount = 0;
      
      server.use(
        rest.get('/api/v1/test', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res(ctx.status(401));
          }
          return res(ctx.json({ success: true }));
        }),
        rest.post('/api/v1/auth/refresh', (req, res, ctx) => {
          return res(ctx.json({ 
            access_token: 'new-token',
            refresh_token: 'new-refresh'
          }));
        })
      );
      
      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });
    
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/v1/test', (req, res) => {
          return res.networkError('Failed to connect');
        })
      );
      
      await expect(client.get('/test')).rejects.toThrow('Network error');
    });
  });
  
  describe('case conversion', () => {
    it('should convert request body from camelCase to snake_case', async () => {
      server.use(
        rest.post('/api/v1/test', async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual({
            user_name: 'test',
            is_active: true
          });
          return res(ctx.json({ success: true }));
        })
      );
      
      await client.post('/test', {
        userName: 'test',
        isActive: true
      });
    });
  });
});
```

#### Service Tests
```typescript
// __tests__/services/api/feedback.test.ts
import { FeedbackService } from '@/services/api/feedback';
import { apiClient } from '@/services/api/client';

jest.mock('@/services/api/client');

describe('FeedbackService', () => {
  let service: FeedbackService;
  
  beforeEach(() => {
    service = new FeedbackService();
    jest.clearAllMocks();
  });
  
  describe('submitFeedback', () => {
    it('should submit feedback with correct data', async () => {
      const mockResponse = { id: 1, status: 'submitted' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
      
      const feedbackData = {
        feedback_type: 'micro' as const,
        content_type: 'scene',
        content_id: '123',
        project_id: 'proj-1',
        rating: 1
      };
      
      const result = await service.submitFeedback(feedbackData);
      
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/feedback',
        feedbackData
      );
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle validation errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(
        new ApiError(400, 'Invalid feedback data')
      );
      
      await expect(service.submitFeedback({} as any))
        .rejects toThrow('Invalid feedback data');
    });
  });
});
```

### Backend Unit Tests

#### Route Handler Tests
```python
# tests/test_feedback_routes.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from plotweaver.main import app
from plotweaver.auth.models import User

client = TestClient(app)

@pytest.fixture
def mock_user():
    return {
        "id": "test-user-id",
        "username": "testuser",
        "email": "test@example.com",
        "is_admin": False
    }

@pytest.fixture
def auth_headers(mock_user):
    # Mock the authentication
    with patch('plotweaver.auth.dependencies.get_current_user', return_value=mock_user):
        return {"Authorization": "Bearer test-token"}

class TestFeedbackRoutes:
    def test_submit_feedback_authenticated(self, auth_headers, mock_user):
        """Test submitting feedback as authenticated user."""
        feedback_data = {
            "feedbackType": "micro",  # Test camelCase conversion
            "contentType": "scene",
            "contentId": "scene-123",
            "projectId": "project-456",
            "rating": 1
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["feedback_type"] == "micro"
        assert result["user_id"] == mock_user["id"]
    
    def test_submit_feedback_anonymous(self):
        """Test submitting feedback as anonymous user."""
        feedback_data = {
            "feedbackType": "micro",
            "contentType": "scene",
            "contentId": "scene-123",
            "projectId": "project-456",
            "rating": -1
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["user_id"] is None
    
    def test_submit_feedback_validation_error(self, auth_headers):
        """Test feedback validation."""
        feedback_data = {
            "feedbackType": "invalid",  # Invalid type
            "contentType": "scene",
            "contentId": "scene-123"
            # Missing required fields
        }
        
        response = client.post(
            "/api/v1/feedback",
            json=feedback_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        assert "validation_error" in response.json()["detail"][0]["type"]
```

#### Service Tests
```python
# tests/test_event_tracker.py
import pytest
from datetime import datetime
from unittest.mock import Mock, AsyncMock

from plotweaver.services.event_tracker import EventTracker

class TestEventTracker:
    @pytest.fixture
    def tracker(self):
        return EventTracker()
    
    @pytest.mark.asyncio
    async def test_track_event(self, tracker):
        """Test event tracking."""
        event_data = {
            "action": "scene_viewed",
            "scene_id": "123"
        }
        
        event = await tracker.track(
            event_type="user_action",
            event_data=event_data,
            user_id="user-123",
            session_id="session-456"
        )
        
        assert event.event_type == "user_action"
        assert event.event_data == event_data
        assert event.user_id == "user-123"
        assert event.session_id == "session-456"
        assert isinstance(event.timestamp, datetime)
    
    @pytest.mark.asyncio
    async def test_batch_events(self, tracker):
        """Test batch event processing."""
        events = [
            {
                "event_type": "page_view",
                "event_data": {"page": "/home"},
                "session_id": "session-123"
            },
            {
                "event_type": "button_click",
                "event_data": {"button": "submit"},
                "session_id": "session-123"
            }
        ]
        
        results = await tracker.process_batch(events)
        
        assert len(results) == 2
        assert all(r.id is not None for r in results)
```

## Integration Testing Strategy

### Frontend Integration Tests

#### API Integration Tests
```typescript
// __tests__/integration/api-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import { AuthProvider } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Dashboard } from '@/pages/Dashboard';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Authentication Flow', () => {
  it('should login user and fetch dashboard data', async () => {
    const user = userEvent.setup();
    
    // Mock login endpoint
    server.use(
      rest.post('/api/v1/auth/login', async (req, res, ctx) => {
        const { username, password } = await req.json();
        
        if (username === 'test@example.com' && password === 'password123') {
          return res(ctx.json({
            access_token: 'test-token',
            user: {
              id: '123',
              username: 'test@example.com',
              email: 'test@example.com'
            }
          }));
        }
        
        return res(ctx.status(401));
      }),
      
      // Mock dashboard data
      rest.get('/api/v1/projects', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer test-token') {
          return res(ctx.status(401));
        }
        
        return res(ctx.json({
          projects: [
            { id: '1', name: 'Project 1' },
            { id: '2', name: 'Project 2' }
          ]
        }));
      })
    );
    
    // Render login form
    const { rerender } = render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill and submit form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Wait for redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
    
    // Render dashboard
    rerender(
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    );
    
    // Check projects loaded
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });
});
```

### Backend Integration Tests

#### Database Integration Tests
```python
# tests/integration/test_feedback_integration.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from plotweaver.models import Feedback, User, Project

@pytest.mark.asyncio
async def test_feedback_workflow(db_session: AsyncSession):
    """Test complete feedback workflow."""
    # Create test data
    user = User(
        username="testuser",
        email="test@example.com"
    )
    db_session.add(user)
    
    project = Project(
        name="Test Project",
        owner_id=user.id
    )
    db_session.add(project)
    await db_session.commit()
    
    # Submit feedback
    feedback = Feedback(
        feedback_type="micro",
        content_type="scene",
        content_id="scene-123",
        project_id=project.id,
        user_id=user.id,
        rating=1
    )
    db_session.add(feedback)
    await db_session.commit()
    
    # Query feedback
    result = await db_session.get(Feedback, feedback.id)
    assert result is not None
    assert result.user_id == user.id
    assert result.project_id == project.id
```

## End-to-End Testing Strategy

### E2E Test Scenarios

#### Critical User Flows
```typescript
// e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('complete feedback submission flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to project
    await page.waitForURL('/dashboard');
    await page.click('text=Project 1');
    
    // View scene
    await page.waitForURL(/\/projects\/\d+/);
    await page.click('text=Scene 1');
    
    // Submit feedback
    await page.click('button[aria-label="Good"]');
    await expect(page.locator('text=Thanks for your feedback')).toBeVisible();
    
    // Add comment
    await page.click('button[aria-label="Add comment"]');
    await page.fill('textarea', 'Great scene!');
    await page.click('button[type="submit"]');
    
    // Verify feedback saved
    await expect(page.locator('text=Great scene!')).toBeVisible();
  });
  
  test('anonymous user feedback', async ({ page }) => {
    // Go directly to public project
    await page.goto('/projects/public-123/scenes');
    
    // Submit feedback without login
    await page.click('button[aria-label="Bad"]');
    await expect(page.locator('text=Thanks for your feedback')).toBeVisible();
    
    // Verify no login prompt
    await expect(page.locator('text=Login')).not.toBeVisible();
  });
});
```

### Visual Regression Testing
```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('feedback component appearance', async ({ page }) => {
    await page.goto('/test-feedback-component');
    
    // Take screenshot
    await expect(page.locator('.feedback-widget')).toHaveScreenshot(
      'feedback-widget.png'
    );
    
    // Hover state
    await page.hover('button[aria-label="Good"]');
    await expect(page.locator('.feedback-widget')).toHaveScreenshot(
      'feedback-widget-hover.png'
    );
    
    // Active state
    await page.click('button[aria-label="Good"]');
    await expect(page.locator('.feedback-widget')).toHaveScreenshot(
      'feedback-widget-active.png'
    );
  });
});
```

## Performance Testing Strategy

### Load Testing with k6
```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.05'],            // Error rate under 5%
  },
};

export default function() {
  // Login
  const loginRes = http.post(
    'http://localhost:8000/api/v1/auth/login',
    JSON.stringify({
      username: 'loadtest@example.com',
      password: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  if (loginRes.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Submit feedback
  const feedbackRes = http.post(
    'http://localhost:8000/api/v1/feedback',
    JSON.stringify({
      feedback_type: 'micro',
      content_type: 'scene',
      content_id: `scene-${Math.random()}`,
      project_id: 'load-test-project',
      rating: Math.floor(Math.random() * 3) - 1,
    }),
    { headers }
  );
  
  check(feedbackRes, {
    'feedback submitted': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(feedbackRes.status !== 200);
  
  sleep(1);
}
```

### Frontend Performance Testing
```typescript
// lighthouse/performance-test.ts
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runLighthouse(url: string) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  
  await chrome.kill();
  
  const report = JSON.parse(runnerResult.report);
  const performance = report.categories.performance.score * 100;
  
  console.log(`Performance score: ${performance}`);
  
  // Assert minimum performance score
  if (performance < 80) {
    throw new Error(`Performance score ${performance} is below threshold of 80`);
  }
  
  return report;
}

// Test key pages
const pages = [
  'http://localhost:3000/',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/projects/1',
];

for (const page of pages) {
  await runLighthouse(page);
}
```

## Test Data Management

### Test Data Factories
```typescript
// __tests__/factories/index.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

export const userFactory = Factory.define<User>(() => ({
  id: faker.datatype.uuid(),
  username: faker.internet.email(),
  email: faker.internet.email(),
  isAdmin: false,
  createdAt: faker.date.past(),
}));

export const feedbackFactory = Factory.define<Feedback>(() => ({
  id: faker.datatype.number(),
  feedbackType: faker.helpers.arrayElement(['micro', 'friction', 'general']),
  contentType: 'scene',
  contentId: faker.datatype.uuid(),
  projectId: faker.datatype.uuid(),
  rating: faker.helpers.arrayElement([-1, 0, 1]),
  comment: faker.lorem.sentence(),
  userId: faker.datatype.uuid(),
  createdAt: faker.date.recent(),
}));

// Usage
const testUser = userFactory.build();
const testFeedbacks = feedbackFactory.buildList(10);
```

### Database Seeding
```python
# tests/fixtures/seed_data.py
import asyncio
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from plotweaver.models import User, Project, Feedback

fake = Faker()

async def seed_test_data(session: AsyncSession):
    """Seed database with test data."""
    # Create test users
    users = []
    for i in range(10):
        user = User(
            username=fake.email(),
            email=fake.email(),
            is_admin=i == 0  # First user is admin
        )
        users.append(user)
        session.add(user)
    
    # Create test projects
    projects = []
    for i in range(5):
        project = Project(
            name=f"Test Project {i}",
            description=fake.text(),
            owner_id=users[i % len(users)].id
        )
        projects.append(project)
        session.add(project)
    
    # Create test feedback
    for _ in range(100):
        feedback = Feedback(
            feedback_type=fake.random_element(['micro', 'friction', 'general']),
            content_type='scene',
            content_id=fake.uuid4(),
            project_id=fake.random_element(projects).id,
            user_id=fake.random_element(users).id,
            rating=fake.random_element([-1, 0, 1]),
            comment=fake.text() if fake.boolean() else None
        )
        session.add(feedback)
    
    await session.commit()
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          pip install .[dev]
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test
        run: |
          pytest --cov=plotweaver --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: |
          npm run wait-on http://localhost:3000
          npm run wait-on http://localhost:8000/health
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts
          path: |
            playwright-report/
            test-results/
```

## Test Coverage Requirements

### Coverage Targets
- **Overall**: 80% minimum
- **Critical paths**: 95% minimum
- **API endpoints**: 100% coverage
- **Authentication**: 100% coverage
- **Error handling**: 90% coverage

### Coverage Configuration
```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/api/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/test-utils/',
  ],
};
```

## Monitoring & Reporting

### Test Reports
1. **Unit Test Reports**: Jest HTML reporter
2. **Coverage Reports**: Codecov integration
3. **E2E Reports**: Playwright HTML reports
4. **Performance Reports**: k6 Cloud integration

### Metrics Dashboard
- Test execution time trends
- Coverage trends
- Flaky test detection
- Performance regression alerts

This comprehensive testing strategy ensures robust API integration with high confidence in reliability, performance, and user experience.

---

## **Appendix: Sample AI-Assisted Workflow Prompt**

Below is a sample prompt template designed to guide an AI assistant like Claude 4 through a standard development workflow within this project. It emphasizes verification before action, environment setup, and a clear, sequential execution of tasks. This ensures the AI operates methodically and efficiently.

### **Prompt Template**

**Goal:** Implement and test a new API endpoint to fetch a user's profile.

**Context:** We are working on the PlotWeaver backend. The primary tools are Python, FastAPI, and pytest. All development servers and dependencies can be managed via the `Makefile`.

**Your Task:**

Please follow these steps in order. Do not proceed to the next step until the previous one is complete. Use the available tools to perform each action.

**Task List:**

1.  **Verify Necessity:**
    *   First, check if an endpoint for `GET /api/v1/users/{user_id}/profile` already exists in the codebase.
    *   Search through the `src/plotweaver/` directory for this route.
    *   If it exists and is fully implemented, report that the task is already complete and stop.

2.  **Environment Setup (Conditional):**
    *   **Only if the endpoint does not exist**, proceed with this step.
    *   Run the `make dev` command to start the development server.
    *   Run this as a background task so you can continue to execute other commands.
    *   Confirm that the server starts successfully by checking the output.

3.  **Implement the Endpoint:**
    *   Create a new route handler for `GET /api/v1/users/{user_id}/profile` in the appropriate file (e.g., `src/plotweaver/api/user_routes.py`).
    *   The handler should fetch user profile data from the database. For now, a mock response is acceptable.
    *   Ensure the endpoint handles cases where the user is not found (returning a 404 error).

4.  **Write Unit Tests:**
    *   In the corresponding test file (e.g., `tests/api/test_user_routes.py`), add new tests for the profile endpoint.
    *   Include a test for a successful response (200 OK) and a test for the not-found case (404 Not Found).
    *   Use `pytest` and the `TestClient` to execute these tests.

5.  **Verify Implementation:**
    *   Run all unit tests using the `make test-unit` command.
    *   Confirm that all tests, including the new ones, pass successfully.
    *   Provide a final summary of the new endpoint and the tests you've added.

### **Prompt Template 2: Auditing and Testing Existing Features**

# API Endpoint Audit and Testing Agent

## Role Definition

You are an **API Testing Audit Agent** specialized in systematic endpoint discovery, test coverage analysis, and execution verification. Your primary function is to map API endpoints to their corresponding tests, identify coverage gaps, and execute targeted test suites to validate functionality.

## Core Responsibilities

### Discovery and Mapping

- **Endpoint Discovery**: Systematically scan source code for API route definitions
- **Test Coverage Analysis**: Map endpoints to existing test files and identify gaps
- **Dependency Tracking**: Document authentication requirements and endpoint relationships

### Test Execution and Validation

- **Targeted Testing**: Execute specific test suites using pytest filtering
- **Result Analysis**: Capture and interpret test outputs, failures, and coverage metrics
- **Gap Identification**: Flag untested endpoints and missing test scenarios

## Methodology

### Phase 1: Pre-Audit Setup

bash

```bash
# Verify test environment
pytest --version
pip list | grep pytest

# Check test directory structure
find tests/api -name "*.py" -type f | head -10

# Baseline test execution
pytest tests/api -v --tb=short -x 2>/dev/null | grep -E "(PASSED|FAILED|ERROR)" | wc -l
```

### Phase 2: Endpoint Discovery

**Search Pattern**: Use these commands to discover endpoints systematically:

bash

```bash
# Find route definitions
grep -r "@.*route\|@app\.\|@router\." src/plotweaver/api/ --include="*.py"
grep -r "path.*=.*['\"]/" src/plotweaver/api/ --include="*.py"

# Find authentication decorators
grep -r "@requires_auth\|@login_required" src/plotweaver/api/ --include="*.py"
```

**Documentation Format**:

markdown

```markdown
| Endpoint | Method | File | Auth Required | Description |
|----------|--------|------|---------------|-------------|
| /api/v1/auth/login | POST | auth.py:45 | No | User authentication |
| /api/v1/users/{id} | GET | users.py:78 | Yes | Retrieve user profile |
```

### Phase 3: Test Mapping and Execution

**Test Discovery Pattern**:

bash

```bash
# Find test files for specific endpoints
grep -r "test.*login\|login.*test" tests/api/ --include="*.py"
grep -r "def test_" tests/api/ --include="*.py" | grep -i "user\|auth"
```

**Execution Strategy**:

bash

```bash
# Run specific test with verbose output
pytest tests/api/test_auth.py::test_login -v --tb=short

# Run tests matching keyword pattern
pytest tests/api -k "login or authentication" -v --tb=short

# Run with coverage for specific module
pytest tests/api -k "user" --cov=src/plotweaver/api/users --cov-report=term-missing
```

## Specific Tasks with Enhanced Detail

### 1. Endpoint Discovery Checklist

-  Search for FastAPI/Flask route decorators (`@app.get`, `@router.post`, etc.)
-  Identify path parameters and query parameters
-  Document request/response models if available
-  Note middleware and authentication requirements
-  Check for API versioning patterns (v1, v2, etc.)

### 2. Test Plan Structure

Create test plan with these categories:

markdown

```markdown
## Authentication Tests
- [ ] POST /api/v1/auth/login - Valid credentials
- [ ] POST /api/v1/auth/login - Invalid credentials  
- [ ] POST /api/v1/auth/login - Missing fields
- [ ] POST /api/v1/auth/logout - With valid token
- [ ] POST /api/v1/auth/logout - Without token

## User Management Tests  
- [ ] GET /api/v1/users/{id} - Valid user ID
- [ ] GET /api/v1/users/{id} - Invalid user ID
- [ ] GET /api/v1/users/{id} - Unauthorized access
- [ ] PUT /api/v1/users/{id} - Update own profile
- [ ] PUT /api/v1/users/{id} - Update other's profile (forbidden)
```

### 3. Test Execution Protocol

For each endpoint test:

1. **Locate test file**: `find tests/api -name "*test*.py" -exec grep -l "endpoint_name" {} \;`
2. **Preview test**: `grep -A 10 "def test_endpoint_name" tests/api/test_file.py`
3. **Execute test**: `pytest tests/api/test_file.py::test_function_name -v`
4. **Capture output**: Save stdout/stderr for failed tests
5. **Check coverage**: Note any untested code paths

### 4. Output Report Format

markdown

```markdown
# API Endpoint Audit Report

## Summary
- **Total Endpoints Found**: X
- **Endpoints with Tests**: Y (Z%)
- **Test Execution Results**: A passed, B failed, C missing

## Detailed Results

### ✅ Authentication Endpoints
| Endpoint | Test Status | Test File | Notes |
|----------|-------------|-----------|-------|
| POST /api/v1/auth/login | ✅ PASSED (3/3) | test_auth.py | All scenarios covered |
| POST /api/v1/auth/logout | ❌ FAILED (1/2) | test_auth.py | Token expiry test failing |
| POST /api/v1/auth/refresh | ⚠️ MISSING | - | No test file found |

### 📊 Coverage Gaps
1. **Untested Endpoints**:
   - DELETE /api/v1/users/{id} - No test coverage
   - PATCH /api/v1/users/{id}/password - No test coverage

2. **Incomplete Test Scenarios**:
   - GET /api/v1/users - Missing pagination tests
   - POST /api/v1/auth/login - Missing rate limiting tests

### 🔧 Failed Test Details
```

test_auth.py::test_logout_expired_token FAILED AssertionError: Expected 401, got 500 Full traceback: [Include pytest output]

```
## Recommendations
1. **Critical**: Add tests for user deletion endpoint
2. **High**: Fix failing logout test (token expiry handling)
3. **Medium**: Add rate limiting tests for authentication
```

## Error Handling and Edge Cases

### Common pytest Issues

- **Import errors**: Check PYTHONPATH and **init**.py files
- **Fixture not found**: Verify conftest.py location and scope
- **Database state**: Ensure test database is clean between runs

### Troubleshooting Commands

bash

```bash
# Debug import issues
python -c "import sys; print('\n'.join(sys.path))"

# List available fixtures
pytest --fixtures tests/api/

# Run in debug mode
pytest tests/api/test_file.py -vvs --pdb
```

## Tips for Prompt Improvement

**Your prompt structure was solid. Here's what enhanced it:**

1. **Explicit search patterns** - Instead of generic "find", provided specific grep/find commands
2. **Structured output formats** - Tables and templates make results actionable
3. **Error handling guidance** - Anticipated common issues with pytest
4. **Coverage analysis** - Added pytest-cov integration for deeper insights
5. **Incremental execution** - Breaking down test runs to isolate failures

**For future prompts, consider:**

- Including expected file structures or naming conventions
- Specifying output format requirements upfront
- Adding rollback or recovery steps for destructive operations
- Defining success metrics clearly (e.g., "95% test coverage")



Retry

T

revise this prompt to instruct claude to leverage the swagger and swagger-loader mcp tools

Edit

The user wants me to revise the API endpoint audit prompt to incorporate MCP tools - specifically swagger and swagger-loader. This is a significant improvement because:

1. Swagger/OpenAPI specifications provide a standardized way to document APIs
2. Using these tools would be more systematic than grep-based discovery
3. It would provide richer information about endpoints (schemas, parameters, responses)

I need to restructure the prompt to:

- First use swagger-loader to find and load API specifications
- Use swagger tool to parse and analyze the API definitions
- Map discovered endpoints to tests more systematically
- Still maintain the testing execution phase

The user preferences indicate:

- They appreciate brevity and professionalism
- No flattery
- They want education on areas where they're weak
- They want tips on improving prompts

I should make this revision concise but comprehensive, focusing on the practical use of these MCP tools.

# API Endpoint Audit and Testing Agent - MCP Enhanced

## Role Definition

You are an **API Testing Audit Agent** equipped with MCP Swagger tools for systematic API discovery and test validation. Your primary function is to leverage OpenAPI specifications to map endpoints to tests, identify coverage gaps, and execute targeted test suites.

## Core Responsibilities

### API Discovery via Swagger

- **Specification Loading**: Use `swagger-loader` to discover OpenAPI/Swagger files
- **Endpoint Extraction**: Parse API definitions using `swagger` tool
- **Schema Validation**: Extract request/response schemas for test generation
- **Coverage Mapping**: Cross-reference API specs with existing test implementations

## Enhanced Methodology

### Phase 1: API Specification Discovery

markdown

```markdown
## Discovery Steps
1. Use swagger-loader to find all OpenAPI/Swagger files:
   - Search patterns: `openapi.yaml`, `swagger.json`, `*-api.yaml`
   - Common locations: `/docs`, `/api/specs`, `/src/plotweaver/api`
   
2. Load and validate each specification:
   - Check OpenAPI version (2.0, 3.0, 3.1)
   - Verify file completeness
   - Note any parsing errors
```

### Phase 2: Endpoint Extraction Using Swagger Tool

markdown

```markdown
## Extraction Protocol
1. For each loaded specification:
   - Extract all paths and operations
   - Document authentication requirements
   - Capture request/response schemas
   - Note parameter types (path, query, body)

2. Generate endpoint inventory:
   - Group by resource type (auth, users, etc.)
   - Flag deprecated endpoints
   - Identify required vs optional parameters
```

### Phase 3: Test Mapping and Execution

**Automated Test Discovery**:

python

```python
# Pseudo-code for test mapping
for endpoint in swagger.get_endpoints():
    test_keyword = endpoint.operation_id or endpoint.path.replace('/', '_')
    potential_tests = find_tests_matching(test_keyword)
    if not potential_tests:
        mark_as_missing_coverage(endpoint)
```

## Revised Task List

### 1. [ ] **Swagger-Based Discovery**

-  Use `swagger-loader` to locate all API specification files
-  Load each specification with `swagger` tool
-  Extract comprehensive endpoint inventory with:
  - Path patterns
  - HTTP methods
  - Authentication schemes
  - Request/response schemas
  - Parameter definitions

### 2. [ ] **Enhanced Test Plan Generation**

Generate test cases based on OpenAPI schemas:

markdown

```markdown
## For each endpoint from swagger:
- [ ] Happy path (valid request per schema)
- [ ] Schema validation (invalid types, missing required fields)
- [ ] Authentication scenarios (if secured)
- [ ] Error responses (per defined error schemas)
- [ ] Edge cases (boundary values from schema constraints)
```

### 3. [ ] **Intelligent Test Mapping**

-  Match swagger `operationId` to test function names
-  Use path patterns to find related test files
-  Validate test request/response against swagger schemas
-  Flag schema mismatches between tests and specs

### 4. [ ] **Schema-Driven Test Execution**

bash

```bash
# For each endpoint from swagger
pytest -k "{operation_id}" -v --tb=short

# Validate test coverage against swagger paths
pytest --cov=src/plotweaver/api --cov-report=term-missing \
       --cov-report=html:swagger_coverage.html
```

### 5. [ ] **Comprehensive Audit Report**

markdown

```markdown
# API Audit Report - Swagger Enhanced

## Specification Summary
- **Files Found**: [List of OpenAPI/Swagger files]
- **API Version**: [OpenAPI version]
- **Total Endpoints**: X (Y authenticated, Z public)

## Endpoint Coverage Matrix
| Swagger Path | Operation ID | Test Status | Schema Match | Notes |
|--------------|--------------|-------------|--------------|-------|
| POST /api/v1/auth/login | loginUser | ✅ PASSED | ✅ Valid | |
| GET /api/v1/users/{id} | getUser | ❌ FAILED | ⚠️ Response mismatch | |
| DELETE /api/v1/users/{id} | deleteUser | ⚠️ MISSING | - | No test found |

## Schema Validation Results
- **Request Schema Violations**: [List mismatches between tests and specs]
- **Response Schema Violations**: [List response format issues]
- **Undocumented Endpoints**: [Found in code but not in swagger]
- **Unimplemented Endpoints**: [In swagger but not in code]

## Security Coverage
- **Authenticated Endpoints Tested**: X/Y (Z%)
- **Authorization Tests**: [RBAC, permission checks]
- **Input Validation Tests**: [Based on schema constraints]
```

## MCP Tool Usage Patterns

### swagger-loader

python

```python
# Find all API specifications
swagger_files = swagger_loader.find_specs(
    paths=["/workspaces/pw", "docs/api"],
    patterns=["*.yaml", "*.yml", "*.json"],
    recursive=True
)
```

### swagger

python

```python
# Parse and analyze each specification
for spec_file in swagger_files:
    api_spec = swagger.load(spec_file)
    
    # Extract endpoints
    endpoints = swagger.get_endpoints(api_spec)
    
    # Get schemas
    schemas = swagger.get_schemas(api_spec)
    
    # Validate security definitions
    security = swagger.get_security_schemes(api_spec)
```

## Additional Enhancements

### Contract Testing

- Validate that implemented endpoints match swagger specifications
- Check response formats against defined schemas
- Ensure all swagger endpoints have implementations

### Test Generation Hints

- Use swagger request/response examples for test data
- Generate edge cases from schema constraints (min/max values)
- Create security tests from authentication definitions

## Error Handling

### Common Swagger Issues

- **Missing operationId**: Fall back to path-based test discovery
- **Schema $ref resolution**: Ensure all references are resolvable
- **Version conflicts**: Handle both OpenAPI 2.0 and 3.x formats

## Tips for Further Enhancement

**This revision leverages MCP tools for:**

1. **Automated discovery** - No manual grep needed
2. **Schema validation** - Tests match API contracts
3. **Comprehensive coverage** - All swagger endpoints checked
4. **Security awareness** - Authentication requirements from specs

**Consider adding:**

- Request example generation from schemas
- Postman/Insomnia collection import via swagger
- API versioning comparison (if multiple versions exist)
- Performance test generation from swagger paths



Retry

T

revise - add step to verify services are running and start them if needed via make setup-dev, make docker-dev-up, and make dev. add step to verify msp server available. research on web and add step for verifying swagger loader is working and note that swagger may only work on the BFF fastapi frontend.

Edit

The user wants me to revise the prompt to:

1. Add a step to verify services are running and start them if needed using make commands
2. Add a step to verify MCP server availability
3. Research on web about verifying swagger loader functionality
4. Note that swagger may only work on the BFF (Backend for Frontend) FastAPI frontend

Let me search for information about verifying swagger loader and MCP server functionality.



Let me search for information about MCP (Model Context Protocol) server verification and swagger loader specific to MCP tools.



Let me search for information about FastAPI swagger UI and how to verify it's working.



Now I have enough information to revise the prompt. The key findings from my research are:

1. **MCP Server Verification**: MCP servers can be verified through handshake/initialization protocols, and there are various implementations (local vs remote). The Model Context Protocol uses JSON-RPC 2.0 for communication.
2. **Swagger Loader Verification**: Swagger/OpenAPI specifications can be validated using various tools, and the FastAPI framework automatically generates Swagger UI documentation at `/docs` endpoint.
3. **FastAPI Swagger UI**: FastAPI automatically serves Swagger UI at `http://localhost:8000/docs` (or whatever port the service runs on), and ReDoc at `/redoc`. This is particularly relevant for the BFF (Backend for Frontend) service.

Now I'll revise the prompt to include:

- Service startup verification steps
- MCP server availability checks
- Swagger loader verification
- Note about swagger working specifically on the BFF FastAPI frontend

# API Endpoint Audit and Testing Agent - MCP Enhanced

## Role Definition

You are an **API Testing Audit Agent** equipped with MCP Swagger tools for systematic API discovery and test validation. Your primary function is to leverage OpenAPI specifications to map endpoints to tests, identify coverage gaps, and execute targeted test suites.

## Core Responsibilities

### Environment Setup and Verification

- **Service Initialization**: Ensure all required services are running before audit
- **MCP Server Validation**: Verify MCP server availability and handshake
- **Swagger UI Access**: Confirm OpenAPI documentation is accessible
- **Test Environment Readiness**: Validate pytest and dependencies are installed

### API Discovery via Swagger

- **Specification Loading**: Use `swagger-loader` to discover OpenAPI/Swagger files
- **Endpoint Extraction**: Parse API definitions using `swagger` tool
- **Schema Validation**: Extract request/response schemas for test generation
- **Coverage Mapping**: Cross-reference API specs with existing test implementations

## Enhanced Methodology

### Phase 0: Environment Setup and Service Verification

markdown

~~~markdown
## Setup Steps
1. Verify and start required services:
   ```bash
   # Check if services are running
   docker ps | grep pw
   lsof -i :8000  # Check BFF service port
   
   # Start services if needed
   make setup-dev      # Initial setup
   make docker-dev-up  # Start Docker containers
   make dev           # Run development services
~~~

1. Verify MCP server availability:

   bash

   ```bash
   # Check MCP server initialization (look for handshake messages)
   # MCP uses JSON-RPC 2.0 protocol over stdio or HTTP+SSE
   curl -X POST http://localhost:PORT/jsonrpc \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1}'
   ```

2. Verify Swagger UI accessibility:

   bash

   ```bash
   # For BFF FastAPI service (swagger typically only works here)
   curl -I http://localhost:8000/docs
   curl -I http://localhost:8000/openapi.json
   
   # Expected: 200 OK responses
   # Note: Swagger UI is primarily available on the BFF (Backend for Frontend) 
   # FastAPI service, not on all backend services
   ```

```
### Phase 1: API Specification Discovery
```markdown
## Discovery Steps
1. Use swagger-loader to find all OpenAPI/Swagger files:
   - Search patterns: `openapi.yaml`, `swagger.json`, `*-api.yaml`
   - Common locations: `/docs`, `/api/specs`, `/src/plotweaver/api`
   - **Important**: Focus on BFF service specs as swagger typically works there
   
2. Load and validate each specification:
   - Check OpenAPI version (2.0, 3.0, 3.1)
   - Verify file completeness
   - Note any parsing errors

3. Manual verification if swagger-loader fails:
   ```bash
   # Find OpenAPI specs manually
   find . -name "openapi*.yaml" -o -name "swagger*.json" -o -name "*api.yaml" 2>/dev/null
   
   # Validate OpenAPI spec structure
   python -c "import yaml, json; spec = yaml.safe_load(open('path/to/spec.yaml')); print(json.dumps(spec.get('paths', {}), indent=2))"
### Phase 2: Endpoint Extraction Using Swagger Tool
```markdown
## Extraction Protocol
1. For each loaded specification:
   - Extract all paths and operations
   - Document authentication requirements
   - Capture request/response schemas
   - Note parameter types (path, query, body)

2. If swagger tool is unavailable, access via FastAPI:
   ```bash
   # Get OpenAPI spec from FastAPI BFF service
   curl http://localhost:8000/openapi.json | jq '.paths'
   
   # List all endpoints
   curl http://localhost:8000/openapi.json | jq '.paths | keys[]'
```

1. Generate endpoint inventory:
   - Group by resource type (auth, users, etc.)
   - Flag deprecated endpoints
   - Identify required vs optional parameters

```
### Phase 3: Test Mapping and Execution

**Pre-flight Environment Check**:
```bash
# Ensure test environment is ready
pytest --version
pip list | grep pytest-cov

# Check test database is running
docker ps | grep postgres
```

**Automated Test Discovery**:

python

```python
# Pseudo-code for test mapping
for endpoint in swagger.get_endpoints():
    test_keyword = endpoint.operation_id or endpoint.path.replace('/', '_')
    potential_tests = find_tests_matching(test_keyword)
    if not potential_tests:
        mark_as_missing_coverage(endpoint)
```

## Revised Task List

### 1. [ ] **Service and Environment Verification**

-  Verify Docker containers are running (`docker ps`)
-  Start services if needed:
  -  Run `make setup-dev` for initial setup
  -  Run `make docker-dev-up` to start containers
  -  Run `make dev` to start development services
-  Confirm BFF service is accessible at http://localhost:8000
-  Verify Swagger UI loads at http://localhost:8000/docs
-  Check MCP server handshake/availability

### 2. [ ] **Swagger-Based Discovery**

-  Use `swagger-loader` to locate API specification files
-  If swagger-loader unavailable, check BFF service directly:
  -  Access http://localhost:8000/openapi.json
  -  Access http://localhost:8000/docs for interactive UI
-  Load each specification with `swagger` tool
-  Extract comprehensive endpoint inventory

### 3. [ ] **Enhanced Test Plan Generation**

Generate test cases based on OpenAPI schemas:

markdown

```markdown
## For each endpoint from swagger:
- [ ] Happy path (valid request per schema)
- [ ] Schema validation (invalid types, missing required fields)
- [ ] Authentication scenarios (if secured)
- [ ] Error responses (per defined error schemas)
- [ ] Edge cases (boundary values from schema constraints)
```

### 4. [ ] **Intelligent Test Mapping**

-  Match swagger `operationId` to test function names
-  Use path patterns to find related test files
-  Validate test request/response against swagger schemas
-  Flag schema mismatches between tests and specs

### 5. [ ] **Schema-Driven Test Execution**

bash

```bash
# Ensure services are running before tests
docker ps | grep -E "(postgres|redis|pw)"

# For each endpoint from swagger
pytest -k "{operation_id}" -v --tb=short

# Validate test coverage against swagger paths
pytest --cov=src/plotweaver/api --cov-report=term-missing
```

### 6. [ ] **Comprehensive Audit Report**

markdown

```markdown
# API Audit Report - Swagger Enhanced

## Environment Status
- **Docker Services**: [List running containers]
- **BFF Service**: http://localhost:8000 [✅ Running / ❌ Down]
- **Swagger UI**: http://localhost:8000/docs [✅ Accessible / ❌ Error]
- **MCP Server**: [✅ Connected / ❌ Unavailable]

## Specification Summary
- **Files Found**: [List of OpenAPI/Swagger files]
- **Primary API**: BFF FastAPI service (where swagger works)
- **API Version**: [OpenAPI version]
- **Total Endpoints**: X (Y authenticated, Z public)

## Endpoint Coverage Matrix
[... rest of report format remains the same ...]
```

## MCP Tool Usage Patterns

### swagger-loader Verification

python

```python
# Test swagger-loader availability
try:
    swagger_files = swagger_loader.find_specs(
        paths=["/workspaces/pw", "docs/api"],
        patterns=["*.yaml", "*.yml", "*.json"],
        recursive=True
    )
    print(f"Swagger-loader working: Found {len(swagger_files)} specs")
except Exception as e:
    print(f"Swagger-loader error: {e}")
    print("Falling back to FastAPI's built-in OpenAPI endpoint")
```

### Direct FastAPI Access (Fallback)

bash

```bash
# If swagger tools unavailable, use FastAPI directly
# Note: This typically only works on the BFF service
curl http://localhost:8000/openapi.json > bff-openapi.json
python -m json.tool bff-openapi.json | grep -A2 "paths"
```

## Error Handling

### Service Startup Issues

- **Docker not running**: Run `docker info` to verify Docker daemon
- **Port conflicts**: Use `lsof -i :8000` to check port usage
- **Database connection**: Verify postgres container with `docker logs pw-postgres`

### Swagger Access Issues

- **404 on /docs**: Ensure you're accessing the BFF FastAPI service
- **CORS errors**: Check if accessing from correct origin
- **Empty spec**: Verify FastAPI app has routes registered

### MCP Connection Issues

- **Handshake failure**: Check MCP server logs for initialization errors
- **Transport errors**: Verify correct protocol (stdio vs HTTP+SSE)
- **Authentication**: Ensure OAuth tokens if using remote MCP

## Important Notes

**Swagger UI Availability**: FastAPI automatically generates interactive API documentation with Swagger UI at /docs [Medium](https://ayselaydin.medium.com/an-introduction-to-python-fastapi-swagger-ui-fb68d8861fad)[DEV Community](https://dev.to/kfir-g/understanding-fastapi-fundamentals-a-guide-to-fastapi-uvicorn-starlette-swagger-ui-and-pydantic-2fp7). However, in the PlotWeaver architecture, swagger typically only works on the BFF (Backend for Frontend) FastAPI service, not on all microservices.

**Service Dependencies**: The BFF service may depend on other backend services being running. Ensure all Docker containers are up before attempting to access Swagger UI.

**MCP Server Types**: MCP operates on the client-server model with initialization through handshake exchanging capabilities and protocol versions [Model Context Protocol (MCP) an overview](https://www.philschmid.de/mcp-introduction). Verify whether using local (stdio) or remote (HTTP+SSE) transport.

## Tips for Success

1. **Always verify services first** - Don't skip Phase 0
2. **Focus on BFF for Swagger** - Other services may not expose OpenAPI
3. **Use fallbacks** - If MCP tools fail, use direct HTTP access
4. **Check logs** - Docker logs provide valuable debugging info
5. **Test incrementally** - Verify each step before proceeding