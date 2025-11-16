# CLAUDE.md - AI Assistant Guide for Bewerbungstrainer

## Project Overview

**Bewerbungstrainer** (Application/Interview Trainer) is a web application designed to help users prepare for job applications and interviews. This document serves as a comprehensive guide for AI assistants working on this codebase.

### Project Purpose
- Provide interactive training for job interview preparation
- Assist users in crafting compelling application materials
- Offer personalized feedback and guidance
- Track user progress and improvement over time

---

## Technology Stack

### Frontend
- **Framework**: [To be determined - React/Vue/Angular/Svelte]
- **Language**: TypeScript (preferred) or JavaScript
- **Styling**: [To be determined - Tailwind CSS/Material-UI/styled-components]
- **State Management**: [To be determined - Redux/Zustand/Context API/Pinia]
- **Build Tool**: [To be determined - Vite/Webpack/Next.js]

### Backend
- **Runtime**: [To be determined - Node.js/Python/Go]
- **Framework**: [To be determined - Express/FastAPI/NestJS/Django]
- **Database**: [To be determined - PostgreSQL/MongoDB/SQLite]
- **ORM/ODM**: [To be determined - Prisma/TypeORM/Mongoose/SQLAlchemy]

### DevOps & Tools
- **Version Control**: Git
- **CI/CD**: [To be determined - GitHub Actions/GitLab CI/CircleCI]
- **Testing**: [To be determined - Jest/Vitest/Pytest/Cypress]
- **Linting**: ESLint, Prettier (for JS/TS), or language-appropriate linters
- **Package Manager**: [To be determined - npm/yarn/pnpm/pip/cargo]

---

## Repository Structure

```
Bewerbungstrainer/
├── .github/              # GitHub Actions workflows and templates
├── docs/                 # Additional documentation
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components/views
│   ├── services/        # Business logic and API calls
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks (if applicable)
│   ├── store/           # State management
│   ├── assets/          # Static assets (images, fonts)
│   └── styles/          # Global styles and themes
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── public/              # Public static files
├── server/              # Backend code (if applicable)
│   ├── api/            # API routes
│   ├── controllers/    # Request handlers
│   ├── models/         # Data models
│   ├── middleware/     # Express/framework middleware
│   └── config/         # Configuration files
├── scripts/             # Build and utility scripts
├── .env.example         # Environment variable template
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── README.md            # Project documentation
└── CLAUDE.md            # This file - AI assistant guide
```

---

## Development Workflows

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bewerbungstrainer
   ```

2. **Install dependencies**
   ```bash
   npm install  # or yarn/pnpm
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

### Git Workflow

1. **Branch Naming Convention**
   - Feature: `feature/<feature-name>`
   - Bug fix: `fix/<bug-description>`
   - Hotfix: `hotfix/<issue>`
   - Refactor: `refactor/<component-name>`
   - Claude AI branches: `claude/<session-id>`

2. **Commit Message Format**
   ```
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

   Examples:
   - `feat(interview): add video recording functionality`
   - `fix(auth): resolve token expiration issue`
   - `docs(readme): update installation instructions`

3. **Pull Request Process**
   - Create a descriptive PR title
   - Fill out the PR template completely
   - Request reviews from team members
   - Ensure all CI checks pass
   - Squash commits before merging (if required)

### Code Quality

1. **Before Committing**
   - Run linter: `npm run lint`
   - Run formatter: `npm run format`
   - Run tests: `npm test`
   - Build check: `npm run build`

2. **Pre-commit Hooks**
   - Husky runs automated checks
   - Lint-staged formats changed files
   - Tests run for affected code

---

## Key Conventions & Best Practices

### Code Style

1. **TypeScript/JavaScript**
   - Use TypeScript wherever possible
   - Prefer `const` over `let`, avoid `var`
   - Use arrow functions for callbacks
   - Destructure objects and arrays when appropriate
   - Use meaningful variable and function names
   - Keep functions small and focused (single responsibility)

2. **Component Structure** (for React/Vue/similar)
   ```typescript
   // Imports
   import React, { useState, useEffect } from 'react';
   import { SomeType } from '@/types';

   // Types/Interfaces
   interface ComponentProps {
     prop1: string;
     prop2: number;
   }

   // Component
   export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
     // Hooks
     const [state, setState] = useState<SomeType>();

     // Effects
     useEffect(() => {
       // ...
     }, []);

     // Handlers
     const handleAction = () => {
       // ...
     };

     // Render
     return (
       <div>
         {/* JSX */}
       </div>
     );
   };
   ```

3. **File Naming**
   - Components: PascalCase (`InterviewQuestion.tsx`)
   - Utilities: camelCase (`formatDate.ts`)
   - Constants: UPPER_SNAKE_CASE in file (`API_ENDPOINTS.ts`)
   - Types: PascalCase (`UserProfile.types.ts`)

4. **Imports Organization**
   ```typescript
   // 1. External dependencies
   import React from 'react';
   import { useQuery } from '@tanstack/react-query';

   // 2. Internal absolute imports
   import { Button } from '@/components/ui';
   import { useAuth } from '@/hooks';

   // 3. Relative imports
   import { helperFunction } from './utils';
   import styles from './Component.module.css';

   // 4. Type imports (if not inlined)
   import type { ComponentProps } from './types';
   ```

### Security Best Practices

1. **Input Validation**
   - Always validate and sanitize user input
   - Use validation libraries (Zod, Yup, Joi)
   - Never trust client-side data

2. **Authentication & Authorization**
   - Implement proper JWT handling
   - Use HTTP-only cookies for sensitive tokens
   - Validate permissions on every protected route
   - Implement rate limiting

3. **Data Protection**
   - Never commit secrets or API keys
   - Use environment variables for sensitive config
   - Encrypt sensitive data at rest and in transit
   - Follow GDPR/privacy regulations

4. **Common Vulnerabilities to Avoid**
   - SQL Injection: Use parameterized queries/ORM
   - XSS: Sanitize output, use Content Security Policy
   - CSRF: Implement CSRF tokens
   - Insecure Dependencies: Regularly update and audit

### Performance Optimization

1. **Frontend**
   - Lazy load components and routes
   - Optimize images and assets
   - Implement code splitting
   - Use React.memo/useMemo/useCallback appropriately
   - Minimize bundle size

2. **Backend**
   - Implement database indexing
   - Use caching (Redis, in-memory)
   - Optimize database queries (avoid N+1)
   - Implement pagination for large datasets
   - Use compression for responses

### Accessibility (a11y)

- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Use ARIA labels where appropriate
- Test with screen readers
- Support reduced motion preferences

### Internationalization (i18n)

- Use i18n library for translations
- Support German as primary language
- Prepare for English and other languages
- Externalize all user-facing strings
- Handle date/time formatting properly
- Support RTL if needed

---

## Testing Guidelines

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should render correctly', () => {
    // Arrange
    const props = { /* ... */ };

    // Act
    const { getByText } = render(<ComponentName {...props} />);

    // Assert
    expect(getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    // Test user interaction
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main application paths

### What to Test

1. **Always Test**
   - Business logic functions
   - Component rendering
   - User interactions
   - API endpoints
   - Error handling
   - Edge cases

2. **Nice to Have**
   - Utility functions
   - Type guards
   - Complex UI states

3. **Don't Bother Testing**
   - Third-party library internals
   - Simple pass-through components
   - Type definitions themselves

---

## API Design Principles

### RESTful Conventions

```
GET    /api/interviews          # List all interviews
GET    /api/interviews/:id      # Get specific interview
POST   /api/interviews          # Create new interview
PUT    /api/interviews/:id      # Update interview
PATCH  /api/interviews/:id      # Partial update
DELETE /api/interviews/:id      # Delete interview
```

### Response Format

```json
{
  "success": true,
  "data": {
    // Actual data
  },
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful GET/PUT/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Client error (validation)
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Semantic errors
- `500 Internal Server Error`: Server error

---

## Database Design

### Schema Principles

1. **Normalization**
   - Follow 3NF (Third Normal Form) where appropriate
   - Denormalize for performance when justified
   - Document any denormalization decisions

2. **Naming Conventions**
   - Tables: plural, snake_case (`user_profiles`, `interview_sessions`)
   - Columns: snake_case (`created_at`, `user_id`)
   - Foreign keys: `<table>_id` (`user_id`, `interview_id`)
   - Indexes: `idx_<table>_<column>`
   - Constraints: descriptive names

3. **Common Fields**
   - `id`: Primary key (UUID or auto-increment)
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of last update
   - `deleted_at`: Soft delete timestamp (if applicable)

4. **Migrations**
   - Always create migrations for schema changes
   - Never modify existing migrations
   - Include both `up` and `down` migrations
   - Test migrations on staging before production

---

## Environment Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bewerbungstrainer
DB_POOL_MIN=2
DB_POOL_MAX=10

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
SESSION_SECRET=your-session-secret

# External Services
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...

# Feature Flags
ENABLE_VIDEO_RECORDING=true
ENABLE_AI_FEEDBACK=true
```

### Configuration Management

- Use `.env` for local development
- Use `.env.example` as template (committed)
- Never commit actual `.env` files
- Use platform-specific config for production (Vercel, Railway, etc.)
- Validate required env vars on startup

---

## Deployment

### Build Process

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Optional: Run production build locally
npm run preview
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] No linter errors or warnings
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Security audit completed (`npm audit`)
- [ ] Performance tested
- [ ] Error monitoring configured (Sentry, LogRocket)
- [ ] Analytics configured (if applicable)

### Deployment Platforms

- **Vercel**: Recommended for frontend/full-stack
- **Railway/Render**: Good for backend services
- **Netlify**: Alternative for static/JAMstack
- **AWS/GCP/Azure**: For enterprise deployments

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Understand Before Coding**
   - Read relevant code files before making changes
   - Understand the context and purpose
   - Check for existing patterns and follow them
   - Look for similar implementations first

2. **Code Quality Standards**
   - Write TypeScript with proper types (no `any` unless absolutely necessary)
   - Add JSDoc comments for complex functions
   - Include error handling for all async operations
   - Write unit tests for new functionality
   - Ensure accessibility compliance
   - Follow security best practices

3. **Making Changes**
   - Make atomic, focused commits
   - Update tests when changing functionality
   - Update documentation when changing APIs
   - Check for breaking changes
   - Consider backwards compatibility

4. **Communication**
   - Explain your reasoning for architectural decisions
   - Ask for clarification when requirements are ambiguous
   - Suggest improvements when you spot issues
   - Document any technical debt introduced

5. **File Organization**
   - Create new files in appropriate directories
   - Co-locate related files (component + styles + tests)
   - Don't create files unnecessarily
   - Keep files focused and reasonably sized (<300 lines)

6. **Common Pitfalls to Avoid**
   - Don't ignore TypeScript errors
   - Don't skip error handling
   - Don't bypass security measures
   - Don't ignore accessibility
   - Don't create duplicate functionality
   - Don't commit commented-out code
   - Don't use console.log in production code

7. **Before Committing**
   - Run the full test suite
   - Check the build succeeds
   - Review your own changes
   - Ensure no sensitive data is included
   - Verify imports are correct

### Helpful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run E2E tests

# Code Quality
npm run lint            # Run linter
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types

# Database
npm run migrate         # Run database migrations
npm run migrate:rollback # Rollback last migration
npm run seed            # Seed database with test data

# Utilities
npm run clean           # Clean build artifacts
npm audit               # Check for vulnerabilities
npm outdated           # Check for outdated packages
```

---

## Feature-Specific Guidelines

### Interview Module

- Support multiple interview types (behavioral, technical, case study)
- Record user responses (text, audio, or video)
- Provide real-time or post-interview feedback
- Track improvement metrics over time

### Application Materials

- Support CV/resume creation and review
- Provide cover letter templates and feedback
- Offer industry-specific guidance
- Enable export in multiple formats (PDF, DOCX)

### User Profiles

- Store user preferences and progress
- Maintain privacy and data protection
- Allow profile customization
- Support multiple user roles (student, professional, admin)

### AI/ML Integration

- Use AI for feedback generation (GPT/Claude API)
- Implement speech-to-text for interview practice
- Provide sentiment analysis on responses
- Ensure AI responses are helpful and constructive

---

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables are set
   - Check for TypeScript errors

2. **Database Issues**
   - Verify database connection string
   - Check database is running
   - Run pending migrations
   - Check for schema conflicts

3. **Authentication Problems**
   - Verify JWT secrets match
   - Check token expiration settings
   - Clear browser cookies/localStorage
   - Verify CORS settings

4. **Performance Issues**
   - Check for N+1 queries
   - Review bundle size
   - Optimize images and assets
   - Enable caching
   - Use React DevTools Profiler

---

## Resources & Documentation

### Internal Documentation
- Architecture Decision Records (ADRs) in `/docs/adr/`
- API documentation in `/docs/api/`
- Component library in Storybook (if implemented)

### External Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

### For AI Assistants

When contributing code:
1. Follow all guidelines in this document
2. Update this CLAUDE.md if you add new patterns or conventions
3. Maintain consistency with existing code
4. Prioritize code quality and maintainability
5. Think about the next developer who will read your code

### For Human Developers

- Review and approve AI-generated code carefully
- Update this document as the project evolves
- Maintain the conventions established here
- Provide feedback on AI contributions
- Keep documentation up-to-date

---

## Version History

- **v1.0.0** (2025-11-16): Initial CLAUDE.md creation for new Bewerbungstrainer project

---

## Contact & Support

For questions about this codebase or conventions, please:
- Create an issue in the GitHub repository
- Contact the maintainers
- Review existing documentation in `/docs/`

---

**Last Updated**: 2025-11-16
**Document Owner**: Project Team
**Review Frequency**: Monthly or when major changes occur
