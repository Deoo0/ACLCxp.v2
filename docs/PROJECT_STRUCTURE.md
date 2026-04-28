# ACLCXP Project Structure Documentation

## Project Overview
ACLCXP is a comprehensive college management system built with Django REST API backend and React TypeScript frontend. The system manages student activities, house competitions, events, attendance, and academic records with role-based access control.

## Technology Stack
- **Backend**: Django 5.2.6, Django REST Framework, PostgreSQL
- **Frontend**: React 19.2.0, TypeScript, Vite, React Router
- **Authentication**: Custom RBAC system with JWT tokens
- **Database**: PostgreSQL with optimized indexing
- **File Storage**: Cloudinary for profile photos
- **Development**: Docker-ready, environment-based configuration

---

## Root Directory Structure

```
aclcxp/
├── backend/                    # Django REST API backend
├── frontend/                   # React TypeScript frontend  
├── docs/                       # Project documentation
└── PROJECT_STRUCTURE.md        # This file
```

---

## Backend Directory Structure

### Root Backend Files
```
backend/
├── manage.py                   # Django management commands utility
├── requirements.txt            # Python dependencies
└── venv/                       # Virtual environment (gitignored)
```

### Configuration (`backend/config/`)
```
config/
├── __init__.py                 # Package initialization
├── asgi.py                     # ASGI application for async support
├── urls.py                     # Main URL routing configuration
├── wsgi.py                     # WSGI application for deployment
└── settings/                   # Environment-specific settings
    ├── __init__.py            # Settings package initialization
    ├── base.py                # Base settings shared across environments
    ├── development.py         # Development environment settings
    └── production.py          # Production environment settings
```

**Purpose**: Django project configuration with environment-based settings management, CORS configuration, REST framework setup, and database connections.

### Django Apps (`backend/apps/`)

#### Core App (`apps/core/`)
```
core/
├── __init__.py                 # Package initialization
├── admin.py                    # Django admin configuration
├── apps.py                     # App configuration
├── models.py                   # Base models and utilities
├── tests.py                    # Unit tests
├── urls.py                     # App URL patterns
└── views.py                    # Base views and utilities
```

**Purpose**: Provides foundational components including `BaseModel` with timestamps, shared utilities, and common functionality across all apps.

#### Users App (`apps/users/`)
```
users/
├── __init__.py                 # Package initialization
├── admin.py                    # Django admin for user management
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial user table creation
│   └── __init__.py            # Migrations package
├── models.py                   # User and QR code models
├── tests.py                    # User-related tests
├── urls.py                     # User authentication endpoints
└── views.py                    # User management views
```

**Purpose**: Complete user management system with:
- Custom user model with RBAC roles (Student, Facilitator, Organizer, House Leader, Admin)
- QR code generation for student identification
- Email verification and password reset functionality
- Academic information tracking (program, year level)
- House assignment system

#### Houses App (`apps/houses/`)
```
houses/
├── __init__.py                 # Package initialization
├── admin.py                    # House management in Django admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial house table creation
│   └── __init__.py            # Migrations package
├── models.py                   # House model with points system
├── tests.py                    # House-related tests
├── urls.py                     # House management endpoints
└── views.py                    # House operations views
```

**Purpose**: House competition system featuring:
- Five houses: Phoenix, Griffin, Dragon, Titan, Pegasus
- Points tracking and ranking system
- House statistics (wins, participations, member count)
- Visual identity (colors, logos, mottos)

#### Authentication App (`apps/authentication/`)
```
authentication/
├── __init__.py                 # Package initialization
├── admin.py                    # Authentication admin setup
├── apps.py                     # App configuration
├── migrations/                 # Database migrations (empty initially)
│   └── __init__.py            # Migrations package
├── models.py                   # Authentication-related models
├── tests.py                    # Authentication tests
├── urls.py                     # Authentication endpoints
└── views.py                    # Login/logout/register views
```

**Purpose**: Authentication and authorization system handling:
- JWT token generation and validation
- Login/logout functionality
- Password management
- Session management
- Permission validation

#### Events App (`apps/events/`)
```
events/
├── __init__.py                 # Package initialization
├── admin.py                    # Event management in Django admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial event tables
│   └── __init__.py            # Migrations package
├── models.py                   # Event and participation models
├── tests.py                    # Event-related tests
├── urls.py                     # Event management endpoints
└── views.py                    # Event operations views
```

**Purpose**: Comprehensive event management system:
- Event creation and scheduling
- Participant registration and management
- Event categorization and tagging
- House competition events
- Event results and scoring

#### Attendance App (`apps/attendance/`)
```
attendance/
├── __init__.py                 # Package initialization
├── admin.py                    # Attendance admin configuration
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial attendance tables
│   └── __init__.py            # Migrations package
├── models.py                   # Attendance tracking models
├── tests.py                    # Attendance tests
├── urls.py                     # Attendance endpoints
└── views.py                    # Attendance operations views
```

**Purpose**: Attendance tracking system featuring:
- QR code-based check-in/check-out
- Event attendance monitoring
- Attendance analytics and reporting
- Automated attendance verification
- Attendance history tracking

#### Analytics App (`apps/analytics/`)
```
analytics/
├── __init__.py                 # Package initialization
├── admin.py                    # Analytics admin setup
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial analytics tables
│   └── __init__.py            # Migrations package
├── models.py                   # Analytics data models
├── tests.py                    # Analytics tests
├── urls.py                     # Analytics endpoints
└── views.py                    # Analytics reporting views
```

**Purpose**: Data analytics and reporting system:
- Student engagement metrics
- House performance analytics
- Event participation statistics
- Attendance trend analysis
- Performance dashboards

#### Results App (`apps/results/`)
```
results/
├── __init__.py                 # Package initialization
├── admin.py                    # Results management admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial results tables
│   └── __init__.py            # Migrations package
├── models.py                   # Results and scoring models
├── tests.py                    # Results tests
├── urls.py                     # Results endpoints
└── views.py                    # Results management views
```

**Purpose**: Competition results and scoring system:
- Event result recording
- House point allocation
- Ranking and leaderboards
- Performance history
- Achievement tracking

#### Notifications App (`apps/notifications/`)
```
notifications/
├── __init__.py                 # Package initialization
├── admin.py                    # Notifications admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations (empty initially)
│   └── __init__.py            # Migrations package
├── models.py                   # Notification models
├── tests.py                    # Notification tests
├── urls.py                     # Notification endpoints
└── views.py                    # Notification management views
```

**Purpose**: Notification system for:
- Event announcements
- Attendance reminders
- Result notifications
- System alerts
- User communications

#### AI App (`apps/ai/`)
```
ai/
├── __init__.py                 # Package initialization
├── admin.py                    # AI features admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py        # Initial AI-related tables
│   └── __init__.py            # Migrations package
├── models.py                   # AI feature models
├── tests.py                    # AI feature tests
├── urls.py                     # AI service endpoints
└── views.py                    # AI integration views
```

**Purpose**: AI-powered features including:
- Predictive analytics
- Recommendation systems
- Automated insights
- Pattern recognition
- Smart scheduling suggestions

---

## Frontend Directory Structure

### Root Frontend Files
```
frontend/
├── package.json                # Node.js dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Node.js TypeScript config
├── vite.config.ts              # Vite build configuration
├── eslint.config.js            # ESLint linting rules
├── index.html                  # Main HTML template
├── README.md                   # Frontend documentation
└── node_modules/               # Installed dependencies (gitignored)
```

### Source Code (`frontend/src/`)
```
src/
├── main.tsx                    # React application entry point
├── App.tsx                     # Main application component
├── App.css                     # Global application styles
├── index.css                   # Base CSS styles
├── assets/                     # Static assets
│   └── react.svg              # React logo
├── api/                        # API integration layer
├── components/                  # Reusable UI components
│   └── ConnectivityTest.tsx   # Connection testing component
├── context/                    # React context providers
├── hooks/                      # Custom React hooks
├── pages/                      # Page-level components
├── routes/                     # Route configuration
├── services/                   # Business logic services
│   └── api.ts                 # API service configuration
├── types/                      # TypeScript type definitions
└── utils/                      # Utility functions
```

**Purpose**: Modern React application with:
- TypeScript for type safety
- Vite for fast development and building
- Component-based architecture
- API integration with Django backend
- Responsive design support
- Modern ES6+ features

### Public Assets (`frontend/public/`)
```
public/
└── vite.svg                    # Vite logo
```

**Purpose**: Static assets served directly from the root of the built application.

---

## Documentation Directory (`docs/`)

```
docs/
├── README.md                   # Main project documentation
├── API_DOCUMENTATION.md        # REST API endpoints documentation
├── DATABASE_SCHEMA.md          # Database structure documentation
├── DEVELOPMENT_SETUP.md        # Development environment setup guide
└── TESTING_GUIDE.md            # Testing procedures and guidelines
```

**Purpose**: Comprehensive project documentation covering API usage, database design, setup procedures, and testing protocols.

---

## Key Features by App

### User Management
- Role-based access control (RBAC)
- Custom authentication system
- QR code generation for student ID
- Profile management with photo upload
- Academic information tracking

### House System
- Five competitive houses with unique identities
- Points-based ranking system
- House statistics and performance tracking
- Visual branding (colors, logos, mottos)

### Event Management
- Event creation and scheduling
- Participant registration
- House competition events
- Results and scoring integration

### Attendance System
- QR code-based check-in
- Real-time attendance tracking
- Attendance analytics
- Automated verification

### Analytics & Reporting
- Student engagement metrics
- House performance analytics
- Event participation statistics
- Attendance trend analysis

### AI Integration
- Predictive analytics
- Recommendation engine
- Pattern recognition
- Smart scheduling

---

## Development Workflow

### Backend Development
1. Use `python manage.py` for administrative tasks
2. Environment-specific settings in `config/settings/`
3. Each app follows Django best practices
4. Database migrations for schema changes
5. Comprehensive testing in each app

### Frontend Development
1. Use `npm run dev` for development server
2. TypeScript for type safety
3. Component-based architecture
4. API integration through services layer
5. ESLint for code quality

### Database Design
- PostgreSQL with optimized indexing
- Foreign key relationships with proper constraints
- Timestamps on all records via BaseModel
- Migration-based schema management

---

## Security Features
- JWT-based authentication
- Role-based permissions
- CORS configuration
- Environment variable management
- Input validation and sanitization

---

## Deployment Considerations
- Environment-specific settings
- Database migration management
- Static file handling
- API endpoint security
- Performance optimization

---

## API Architecture
- RESTful design principles
- Consistent response formats
- Proper HTTP status codes
- Pagination support
- Error handling standards

---

## Testing Strategy
- Unit tests in each Django app
- Integration tests for API endpoints
- Frontend component testing
- End-to-end testing capabilities
- Performance testing considerations

---

This structure provides a scalable, maintainable, and feature-rich college management system with modern development practices and comprehensive functionality.
