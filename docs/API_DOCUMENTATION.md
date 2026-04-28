# ACLCxp API Documentation

## Base URL
- **Development:** `http://localhost:8000`
- **Production:** `https://your-domain.com`

## Users Endpoints

### Health Check
- **URL:** `/users/health/`
- **Method:** `GET`
- **Auth Required:** No
- **Description:** Test backend connectivity
- **Success Response (200):**
```json
{
  "status": "success",
  "message": "Backend is running!",
  "timestamp": "2024-01-01 12:00:00"
}
```

### Echo Test
- **URL:** `/users/echo/`
- **Method:** `POST`
- **Auth Required:** No
- **Description:** Test data transmission
- **Request Body:**
```json
{
  "test": "data from frontend"
}
```
- **Success Response (200):**
```json
{
  "method": "POST",
  "received_data": {"test": "data from frontend"},
  "message": "I received your data successfully!"
}
```

### Register User
- **URL:** `/users/register/`
- **Method:** `POST`
- **Auth Required:** No
- **Description:** Register a new user account
- **Request Body:**
```json
{
  "email": "string (required)",
  "student_id": "string (required)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "middle_name": "string (optional)",
  "password": "string (required, min 8 chars)",
  "program": "string (required)",
  "year_level": "integer (required, 1-5)",
  "phone_number": "string (optional)",
  "contact_person": "string (optional)",
  "contact_number": "string (optional)"
}
```
- **Success Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "student_id": "2023001",
    "first_name": "John",
    "last_name": "Doe",
    "role": "STUDENT"
  }
}
```
- **Error Response (400):**
```json
{
  "status": "error",
  "message": "Email already registered"
}
```
- **Error Response (400):**
```json
{
  "status": "error",
  "message": "student_id is required"
}
```

## Error Response Format
All error responses follow this format:
```json
{
  "status": "error",
  "message": "Human-readable error description"
}
```

## CORS Configuration
Frontend URLs allowed:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://<your-laptop-ip>:5173` (for mobile testing)

## Testing
Use the health check endpoint to verify connectivity before testing other endpoints.