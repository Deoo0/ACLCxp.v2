# ACLCXP Project Structure Documentation

## Project Overview
ACLCXP is a comprehensive college management system built with Django REST API backend and React TypeScript frontend. The system manages student activities, house competitions, events, attendance, and academic records with role-based access control.

## Technology Stack
- **Backend**: Django 5.2.6, Django REST Framework, PostgreSQL
- **Frontend**: React 19.2.0, TypeScript, Vite, React Router
- **Authentication**: Custom RBAC system with JWT tokens (simplejwt)
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
    ├── __init__.py             # Settings package initialization
    ├── base.py                 # Base settings shared across environments
    ├── development.py          # Development environment settings
    └── production.py           # Production environment settings
```

**URL Convention**: All endpoints are prefixed with `/api/`.
- `api/users/` → apps/users/urls.py
- `api/auth/` → apps/authentication/urls.py
- `api/houses/` → apps/houses/urls.py

**REST Framework Settings**: `AllowAny` is the global default permission.
Individual views override this with `@permission_classes` where needed.

---

### Django Apps (`backend/apps/`)

#### Core App (`apps/core/`)
```
core/
├── __init__.py                 # Package initialization
├── admin.py                    # Django admin configuration
├── apps.py                     # App configuration
├── models.py                   # BaseModel with timestamps
├── tests.py                    # Unit tests
├── urls.py                     # App URL patterns
└── views.py                    # Base views and utilities
```

**Purpose**: Provides `BaseModel` — an abstract model that adds `created_at`
and `updated_at` timestamps to every model that inherits from it.
All app models (User, House, etc.) extend BaseModel.

> **Note**: BaseModel uses Django's default integer primary key.
> UUID primary keys are deferred to a future migration.

---

#### Users App (`apps/users/`)
```
users/
├── __init__.py                 # Package initialization
├── admin.py                    # Django admin for user management
├── apps.py                     # App configuration
├── managers.py                 # Custom UserManager
├── migrations/                 # Database migrations
│   ├── 0001_initial.py         # Initial user table creation
│   └── __init__.py             # Migrations package
├── models.py                   # User and QRCode models
├── permissions.py              # Custom permission classes
├── serializers.py              # RegisterSerializer, UserProfileSerializer
├── signals.py                  # User-related Django signals
├── tests.py                    # User-related tests
├── urls.py                     # User endpoints
└── views.py                    # User management views
```

**Working endpoints**:
- `POST /api/users/register/` — creates a student account (AllowAny)
- `GET /api/health/` — connectivity check (AllowAny)
- `POST /api/echo/` — echo test (AllowAny)

**Registration required fields**:
```json
{
  "student_id": "string",
  "email": "string (@gmail.com only)",
  "password": "string (min 8 chars)",
  "first_name": "string",
  "last_name": "string",
  "middle_name": "string (optional)",
  "program": "string (e.g. BSIT, BSCS, BSHM)",
  "year_level": "integer (1-4)",
  "house_id": "integer (from /api/houses/)"
}
```

**User model notes**:
- `USERNAME_FIELD = 'student_id'` — login uses student_id, not email
- `REQUIRED_FIELDS = ['email', 'first_name', 'last_name']`
- Default role on registration: `STUDENT`
- Roles: `STUDENT`, `FACILITATOR`, `ORGANIZER`, `HOUSE_LEADER`, `ADMIN`
- Programs: `BSIT`, `BSCS`, `BSHM` (more to be added)
- Year levels: 1–4 (irregulars handled separately in future)

**Serializers**:
- `RegisterSerializer` — validates and creates new users, handles house lookup by integer ID
- `UserProfileSerializer` — read-only, returned after login or `/api/auth/me/`

---

#### Houses App (`apps/houses/`)
```
houses/
├── __init__.py                 # Package initialization
├── admin.py                    # House management in Django admin
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   ├── 0001_initial.py         # Initial house table creation
│   └── __init__.py             # Migrations package
├── models.py                   # House and HouseStanding models
├── serializers.py              # House serializers
├── tests.py                    # House-related tests
├── urls.py                     # House management endpoints
├── views.py                    # House operations views
└── management/
    └── commands/
        └── seed_houses.py      # One-time setup: seeds the 5 ACLC houses
```

**Working endpoints**:
- `GET /api/houses/` — list all active houses, public, no auth required
- `POST /api/houses/add/` — create a house (admin only, currently open)

**The five ACLC houses**:
| Name | Color | Hex |
|------|-------|-----|
| Giallio | Yellow | #FEF74E |
| Vierrdy | Green | #7E8230 |
| Azul | Blue | #0884FE |
| Cahel | Orange | #DB5609 |
| Roxxo | Red | #E20F16 |

**First-time setup** — after migrating, run:
```bash
python manage.py seed_houses
```
This populates the houses table. Registration will fail without it.
Houses can also be added manually via pgAdmin if preferred.

---

#### Authentication App (`apps/authentication/`)
```
authentication/
├── __init__.py                 # Package initialization
├── admin.py                    # Authentication admin setup
├── apps.py                     # App configuration
├── migrations/                 # Database migrations
│   └── __init__.py             # Migrations package
├── models.py                   # Authentication-related models
├── tests.py                    # Authentication tests
├── urls.py                     # Authentication endpoints
└── views.py                    # Login, logout, token refresh views
```

**Working endpoints**:
- `POST /api/auth/login/` — takes student_id + password, returns JWT tokens (AllowAny)
- `POST /api/auth/logout/` — blacklists refresh token (IsAuthenticated)
- `POST /api/auth/token/refresh/` — returns new access token (AllowAny)

**Login response shape**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access": "JWT access token",
    "refresh": "JWT refresh token",
    "user": {
      "id": 4,
      "email": "student@gmail.com",
      "student_id": "2024-0001",
      "first_name": "string",
      "last_name": "string",
      "role": "STUDENT"
    }
  }
}
```

---

#### Events App (`apps/events/`)
```
events/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   ├── 0001_initial.py
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Schema exists. Endpoints not yet implemented.

---

#### Attendance App (`apps/attendance/`)
```
attendance/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   ├── 0001_initial.py
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Schema exists. Endpoints not yet implemented.

---

#### Analytics App (`apps/analytics/`)
```
analytics/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   ├── 0001_initial.py
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Deferred to next semester.

---

#### Results App (`apps/results/`)
```
results/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   ├── 0001_initial.py
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Schema exists. Endpoints not yet implemented.

---

#### Notifications App (`apps/notifications/`)
```
notifications/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Schema exists. Endpoints not yet implemented.

---

#### AI App (`apps/ai/`)
```
ai/
├── __init__.py
├── admin.py
├── apps.py
├── migrations/
│   ├── 0001_initial.py
│   └── __init__.py
├── models.py
├── tests.py
├── urls.py
└── views.py
```
**Status**: Deferred to next semester.

---

## Frontend Directory Structure

### Source Code (`frontend/src/`)
```
src/
├── components/          # Reusable UI building blocks shared across pages
│   ├── admin/           # Admin-specific reusable components
│   ├── dashboard/       # Student/Staff dashboard widgets and cards
│   ├── landing/         # Components used by the public landing page
│   ├── layouts/         # Page layout wrappers (Admin, Authenticated, etc.)
│   ├── navigation/      # Headers, sidebars, bottom navigation, menus
│   └── ui/              # Generic UI elements (modals, dialogs, loaders, etc.)
│
├── context/             # React Context providers and global state
│
├── pages/               # Route-level pages
│   ├── admin/           # Admin-only pages and management screens
│   ├── auth/            # Authentication pages (Login, Register)
│   ├── dev/             # Development/testing utilities and diagnostics
│   ├── public/          # Publicly accessible pages
│   └── student/         # Student-facing authenticated pages
│
├── routes/              # Route guards and route configuration
│
├── services/            # API communication and business logic layer
│
├── App.tsx              # Root application component
├── App.css              # Application-level styles
├── index.css            # Global styles and Tailwind imports
└── main.tsx             # React application entry point
```

---

### Folder Usage Guidelines

#### `pages/`
Pages represent **full routes/screens**.

Examples:

```
pages/public/LandingPage.tsx
pages/auth/LoginPage.tsx
pages/student/DashboardPage.tsx
pages/admin/UsersPage.tsx
```

Create a new file here when:
- A new URL/route is needed
- A complete screen is being built

Do **not** place reusable UI components here.

---

#### `components/`
Components are reusable pieces used inside pages.

Examples:

```
components/dashboard/DashboardStatCards.tsx
components/navigation/StudentBottomNav.tsx
components/ui/Modal.tsx
```

Create a component when:
- The UI is reused in multiple places
- A page becomes too large and should be split into smaller parts

---

#### `components/layouts/`
Contains page wrappers that define overall page structure.

Examples:

```
AuthenticatedLayout.tsx
AdminLayout.tsx
```

Layouts usually contain:
- Headers
- Navigation
- Sidebars
- Main content containers

---

#### `components/navigation/`
Contains navigation-related UI.

Examples:

```
PublicHeader.tsx
StudentBottomNav.tsx
AdminSidebar.tsx
```

Only navigation elements belong here.

---

#### `components/ui/`
Contains generic UI elements that can be used anywhere.

Examples:

```
Modal.tsx
ForgotPasswordModal.tsx
Loader.tsx
Button.tsx
```

These components should not contain page-specific logic.

---

#### `services/`
Contains all backend communication.

Examples:

```
api.ts
auth.ts
eventService.ts
userService.ts
```

Avoid making Axios calls directly inside pages whenever possible.

---

#### `routes/`
Contains route definitions and access control.

Examples:

```
AppRoutes.tsx
ProtectedRoute.tsx
PublicRoute.tsx
```

Used for:
- Route registration
- Authentication guards
- Role-based access control

---

### Naming Conventions

#### Pages

```
DashboardPage.tsx
ProfilePage.tsx
UsersPage.tsx
```

Always use the `Page` suffix.

---

#### Layouts

```
AdminLayout.tsx
AuthenticatedLayout.tsx
```

Always use the `Layout` suffix.

---

#### Modals

```
DeleteConfirmModal.tsx
ForgotPasswordModal.tsx
```

Always use the `Modal` suffix.

---

#### Navigation Components

```
PublicHeader.tsx
StudentBottomNav.tsx 
AdminSidebar.tsx
```

Use descriptive names based on purpose and audience.

---

### Provider Hierarchy (`main.tsx`)
```
StrictMode
  └── BrowserRouter         ← React Router (routing must wrap everything)
        └── AuthProvider    ← Auth context (user state, login/logout)
              └── App       ← Route definitions
```

---

### Route Structure (`App.tsx`)
| Path | Component | Access |
|------|-----------|--------|
| `/` | LandingPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public (placeholder) |
| `/connectivity` | ConnectivityTestPage | Public |
| `/dashboard` | Dashboard | Protected — requires login (placeholder UI) |

---

### Auth Service Layer (`services/auth.ts`)

**Functions available to frontend components**:
```typescript
login(credentials)        // POST /api/auth/login/ — saves tokens, returns user
register(data)            // POST /api/users/register/ — creates student account
logout()                  // POST /api/auth/logout/ — blacklists token, clears storage
refreshAccessToken()      // POST /api/auth/token/refresh/ — gets new access token
```

**Token helpers**:
```typescript
saveTokens(tokens)        // saves access + refresh to localStorage
clearTokens()             // removes both tokens from localStorage
getAccessToken()          // returns access token or null
getRefreshToken()         // returns refresh token or null
```

---

### How to Use Auth in a Component (`useAuth` hook)

```tsx
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, isLoading, login, logout } = useAuth();
```

**Login form example**:
```tsx
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async () => {
  try {
    await login({ student_id, password });
    navigate('/dashboard');
  } catch {
    setError('Invalid student ID or password');
  }
};
```

The `login()` function handles tokens automatically.
Components only need to handle UI state (loading, error messages, redirect).

---

## Public Assets (`frontend/public/`)
```
public/
├── aclc-logo.png               # ACLC school logo
├── aclcxp-bg.png               # Background image
└── aclcxp-logo.png             # ACLCxp app logo
```

---

## Documentation Directory (`docs/`)
```
docs/
├── README.md                   # Main project documentation
├── API_DOCUMENTATION.md        # REST API endpoints documentation
├── DATABASE_SCHEMA.md          # Database structure documentation
├── DEVELOPMENT_SETUP.md        # Development environment setup guide
├── PROJECT_STRUCTURE.md        # This file
└── TESTING_GUIDE.md            # Testing procedures and guidelines
```

---

## First-Time Setup (New Team Member)

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_houses
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Verify setup
```
GET http://localhost:8000/api/houses/
```
Should return all 5 ACLC houses.

---

## Security Notes
- JWT access tokens stored in `localStorage` — acceptable for capstone scope
- All protected routes require valid Bearer token in Authorization header
- Token is attached automatically via Axios request interceptor in `api.ts`
- Refresh token blacklisted on logout via simplejwt token blacklist
- Email restricted to `@gmail.com` on registration

---

## Development Workflow
1. Always create a new branch before making changes
2. Commit every meaningful change with a descriptive message
3. Branches are reviewed before merging to main
4. Test backend endpoints in Postman before connecting to frontend
5. Coordinate changes that affect shared files (models, serializers) with the team

---

## Deferred to Next Semester
- UUID primary keys across all models (currently integer)
- AI features (predictive analytics, recommendations)
- Advanced analytics and reporting
- Email verification flow
- Password reset flow
- QR code generation and scanning
