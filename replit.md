# EduLearn - EdTech Platform

## Overview

A full-stack EdTech learning platform similar to Udemy/Coursera with role-based access (Admin, Trainer, Student) and AI-powered learning planner.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/edtech) at path `/`
- **API framework**: Express 5 (artifacts/api-server) at path `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT + bcryptjs

## Architecture

### Frontend (artifacts/edtech)
- React + Vite with Tailwind CSS
- Wouter for routing
- TanStack React Query for data fetching
- Framer Motion for animations
- Deep navy/indigo theme with dark mode support
- Role-based dashboards (admin, trainer, student)

### Backend (artifacts/api-server)
- Express 5 REST API
- JWT authentication with bcryptjs password hashing
- Session secret stored in SESSION_SECRET env var

### Database (lib/db)
Tables: users, categories, courses, lessons, course_ratings, enrollments, attendance, learning_plans

### Shared Libraries
- lib/api-client-react: Generated React Query hooks from OpenAPI spec
- lib/api-zod: Generated Zod schemas from OpenAPI spec
- lib/api-spec: OpenAPI spec source + codegen config

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Test Accounts

- Admin: admin@edulearn.com / admin123
- Trainer: sarah@edulearn.com / trainer123
- Trainer: alex@edulearn.com / trainer123
- Student: emma@edulearn.com / student123

## Features

- User registration/login with role selection (student/trainer)
- Admin dashboard: platform stats, user management (block/approve), category management
- Trainer dashboard: course CRUD, lesson management, attendance marking, analytics
- Student dashboard: enrolled courses with progress, attendance summary, AI roadmap
- Course listing with search and category filters
- Course detail page with lessons, ratings, enrollment
- Course player with progress tracking
- AI Learning Planner: generates personalized weekly roadmaps based on career goals
- My Roadmap: visual timeline with milestones

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
