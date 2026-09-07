# Cerios Clinic — Functional Documentation

This directory contains the functional documentation for the Cerios Clinic management system.

## Document Overview

| Document | Description |
|----------|-------------|
| [DFD-Level0.md](./DFD-Level0.md) | Context diagram — the system as a black box interacting with external entities |
| [DFD-Level1.md](./DFD-Level1.md) | Level 1 Data Flow Diagram — detailed processes per domain |
| [ERD.md](./ERD.md) | Entity Relationship Diagram based on the Prisma database schema |
| [UseCases.md](./UseCases.md) | Use cases for all four roles: Patient, Doctor, Assistant, Admin |
| [Glossary.md](./Glossary.md) | Glossary of domain terms and abbreviations |

## System Summary

Cerios Clinic is a full-stack clinic management system consisting of:

- **4 Frontend Portals** — React/Vite applications for each user role
- **4 Backend APIs** — NestJS services with role-based access control
- **Authentication** — Keycloak identity provider with JWT tokens
- **Database** — PostgreSQL with Prisma ORM
- **Mobile App** — React Native (Android) for patients

### User Roles

| Role | Portal | API | Purpose |
|------|--------|-----|---------|
| Patient | Patient Portal (5173) | api-patient (3001) | View/book appointments, prescriptions, reviews |
| Doctor | Doctor Portal (5174) | api-doctor (3002) | Manage schedule, patients, prescriptions |
| Assistant | Assistant Portal (5175) | api-assistant (3003) | Manage appointments, patient data |
| Admin | Admin Portal (5176) | api-admin (3004) | System administration, feature toggles |

### Core Domains

1. **Appointments** — Scheduling, status management, history tracking
2. **Prescriptions** — Medication orders linked to appointments
3. **Reviews** — Patient feedback on doctor consultations
4. **Availability** — Doctor unavailability periods
5. **User Management** — Profile management, role-based access
6. **Feature Toggles** — Runtime feature flags for controlled rollouts

## Diagram Conventions

All diagrams use **Mermaid** syntax and render automatically on GitHub/GitLab.

- **DFD**: Yourdon/DeMarco notation adapted for Mermaid flowcharts
- **ERD**: Mermaid erDiagram with Crow's Foot relationships
- **Flows**: Numbered data flows (e.g., `F1.1`, `F1.2`) for traceability
