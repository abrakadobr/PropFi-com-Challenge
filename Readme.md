# Student Management System - Developer Skill Test

A comprehensive full-stack web application for managing school operations including students, staff, classes, notices, and leave management. This project serves as a skill assessment platform for **Frontend**, **Backend**, and **Blockchain** developers.

## 🏗️ Project Architecture

```
skill-test/
├── frontend/           # React + TypeScript + Material-UI
├── backend/            # Node.js + Express + PostgreSQL
├── go-service/         # Golang microservice for PDF reports
├── seed_db/            # Database schema and seed data
├── dockers/            # Dockerfiles for development containers
├── tests/              # Cypress test framework with backend tests
├── docker-compose.yml  # Compose file for development environment
├── .env.example        # Example with default values for env configurable variables 
└── README.md           # This file
```

## 🚀 Really Quick Start

### Prerequisites
- docker
- docker compose

### 1. App quick start
```bash
docker compose up --build
```

This will build and launch:

- Postgres DataBase, initialized by seed_db
- Postgress Admin - UI for postgres db on http://localhost:5050
- Backend node with default access on http://localhost:5007
- Frontend dev build on http://localhost:5173

### 2. Cypress tests UI 
```bash
cd tests && npm i && npm run open
```

Currently only 2 tests defined:

- Guest Access Test - testing backend routes without providing any Credentials
- Admin Access Test - testing backend routes authorized as admin-level user

#### Development TODO

- Add other tests for "teacher/student/..." roles.
- Add "scenarios tests" for expecting platform users behaviors

## 🚀 Not Really Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. ** Database Setup **
```bash
# Create PostgreSQL database
createdb school_mgmt

# Run database migrations
psql -d school_mgmt -f seed_db/tables.sql
psql -d school_mgmt -f seed_db/seed-db.sql
```

## Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5007
- **Demo Credentials**: 
  - Email: `admin@school-admin.com`
  - Password: `3OU4zn3q6Zh9`


## 🎯 Skill Test Problems

### **Frontend Developer Challenge**
**Fix "Add New Notice" Page**

- **Location**: `/app/notices/add`
- **Issue**: When clicking the 'Save' button, the 'description' field doesn't get saved
- **Skills Tested**: React, Form handling, State management, API integration
- **Expected Fix**: Ensure description field is properly bound and submitted
- **Fix**: [commit](https://github.com/abrakadobr/PropFi-com-Challenge/commit/f197092cb63e7a524d70a910eef7e26c7f889426) - wrong naming of "description" field as "content" (possible outdated) 

### **Backend Developer Challenge**
**Complete CRUD Operations in Student Management**

- **Location**: `/src/modules/students/students-controller.js`
- **Issue**: Implement missing CRUD operations for student management
- **Skills Tested**: Node.js, Express, PostgreSQL, API design
- **Expected Implementation**: Full Create, Read, Update, Delete operations
- **Fix**: [commit](https://github.com/abrakadobr/PropFi-com-Challenge/commit/57d637bd6e3f5d8443209a9707430b4694a97ce6)

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v6
- **State Management**: Redux Toolkit + RTK Query
- **Form Handling**: React Hook Form + Zod validation
- **Build Tool**: Vite
- **Code Quality**: ESLint, Prettier, Husky

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + CSRF protection
- **Password Hashing**: Argon2
- **Email Service**: Resend API
- **Validation**: Zod

### Database
- **Primary DB**: PostgreSQL
- **Schema**: Comprehensive school management schema
- **Features**: Role-based access control, Leave management, Notice system

## 📋 Features

### Core Functionality
- **Dashboard**: User statistics, notices, birthday celebrations, leave requests
- **User Management**: Multi-role system (Admin, Student, Teacher, Custom roles)
- **Academic Management**: Classes, sections, students, class teachers
- **Leave Management**: Policy definition, request submission, approval workflow
- **Notice System**: Create, approve, and distribute notices
- **Staff Management**: Employee profiles, departments, role assignments
- **Access Control**: Granular permissions system

### Security Features
- JWT-based authentication with refresh tokens
- CSRF protection
- Role-based access control (RBAC)
- Password reset and email verification
- Secure cookie handling

## 🔧 Development Guidelines

### Code Standards
- **File Naming**: kebab-case for consistency across OS
- **Import Style**: Absolute imports for cleaner code
- **Code Formatting**: Prettier with consistent configuration
- **Git Hooks**: Husky for pre-commit quality checks

### Project Structure
```
frontend/src/
├── api/           # API configuration and base setup
├── assets/        # Static assets (images, styles)
├── components/    # Shared/reusable components
├── domains/       # Feature-based modules
│   ├── auth/      # Authentication module
│   ├── students/  # Student management
│   ├── notices/   # Notice system
│   └── ...
├── hooks/         # Custom React hooks
├── routes/        # Application routing
├── store/         # Redux store configuration
├── theme/         # MUI theme customization
└── utils/         # Utility functions
```

```
backend/src/
├── config/        # Database and app configuration
├── middlewares/   # Express middlewares
├── modules/       # Feature-based API modules
│   ├── auth/      # Authentication endpoints
│   ├── students/  # Student CRUD operations
│   ├── notices/   # Notice management
│   └── ...
├── routes/        # API route definitions
├── shared/        # Shared utilities and repositories
├── templates/     # Email templates
└── utils/         # Helper functions
```

## 🧪 Testing Instructions

### For Frontend Developers
1. Navigate to the notices section
2. Try to create a new notice with description
3. Verify the description is saved correctly
4. Test form validation and error handling

### For Backend Developers
1. Test all student CRUD endpoints using Postman/curl
2. Verify proper error handling and validation
3. Check database constraints and relationships
4. Test authentication and authorization

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/refresh` - Refresh access token

### Student Management
- `GET /api/v1/students` - List all students
- `POST /api/v1/students` - Create new student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

### Notice Management
- `GET /api/v1/notices` - List notices
- `POST /api/v1/notices` - Create notice
- `PUT /api/v1/notices/:id` - Update notice
- `DELETE /api/v1/notices/:id` - Delete notice

### PDF Generation Service (Go)
- `GET /api/v1/students/:id/report` - Generate and download a PDF report for a specific student.

## 🤝 Contributing / Submission Instructions

1. Complete the assigned task
2. Push your results to a public repository
3. Share the repository link along with a short Loom video demonstrating your results.

## 🆘 Support

For questions and support:
- Create an issue in the repository
- Check existing documentation in `/frontend/README.md` and `/backend/README.md`
- Review the database schema in `/seed_db/tables.sql`

---

**Happy Coding! 🚀**

## Outro

Codebase is very outdated and should not be used for any other reasons.
Node18 is required for correct build and this version is officially unsupported.

### Frontend

General react problems when project grows bigger then 2 pages. 10k lines of code for 10 pages dashboard are harder and harder supported in future. Strong recommendation switch to Vue/Vuex so fast as possible.

### Backend

Overcomplicated code with strange non-required dependencies.
Bad scale-ability, architecture not allows traffic control by roles/geodata/time, there is no realtime communication.

### Database

I would rise a question about database functions as additional layer of complexity and having business logic inside database.
There are two points: having backend as business logic, or having "cloud app" (like firebase/supabase) with business logic in database/cloud functions.
Current architecture mixing both without obvious reasons or wins but with obvious looses.
