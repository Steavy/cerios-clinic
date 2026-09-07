# Glossary

Domain terms and abbreviations used throughout the Cerios Clinic documentation and codebase.

## Domain Terms

| Term | Definition |
|------|------------|
| **Appointment** | A scheduled consultation between a patient and a doctor at a specific date and time |
| **Assistant** | Reception or administrative staff who manage appointments and patient data on behalf of the clinic |
| **Availability** | The time periods during which a doctor is available for appointments |
| **Doctor** | A medical professional who conducts consultations, creates prescriptions, and manages their schedule |
| **Feature Toggle** | A runtime flag that enables or disables specific functionality without code deployment |
| **Patient** | A person who books appointments, receives prescriptions, and submits reviews |
| **Prescription** | A medical order issued by a doctor containing one or more medications with dosage instructions |
| **Prescription Item** | An individual medication within a prescription (name, dosage, frequency, duration) |
| **Review** | Patient feedback on a completed appointment, consisting of a rating and optional comment |
| **Unavailability** | A period during which a doctor cannot accept new appointments (e.g., vacation, conference) |
| **User** | Any person with an account in the system (patient, doctor, assistant, or admin) |

## Status Terms

| Term | Definition |
|------|------------|
| **SCHEDULED** | Initial appointment status — appointment is booked but not yet confirmed |
| **CONFIRMED** | Appointment has been confirmed by a doctor or assistant |
| **COMPLETED** | Appointment has been conducted — terminal state |
| **CANCELLED** | Appointment has been cancelled — terminal state |

## Technical Terms

| Term | Definition |
|------|------------|
| **JWT** | JSON Web Token — used for authenticated API requests |
| **Keycloak** | Open-source identity provider handling authentication, authorization, and user management |
| **Monorepo** | A single repository containing multiple applications and shared packages |
| **NestJS** | TypeScript framework used for the backend API services |
| **Prisma** | TypeScript ORM used for database access and schema management |
| **React Native** | Framework for building the Android mobile application |
| **Vite** | Build tool used for the frontend React portals |

## Architecture Terms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface — backend service handling business logic |
| **Portal** | Frontend web application for a specific user role |
| **Data Store** | A persistent data repository (database table) |
| **External Entity** | A person or system outside the application boundary that interacts with the system |
| **Process** | A functional unit within the system that transforms inputs to outputs |
| **Data Flow** | The movement of data between processes, data stores, and external entities |

## Diagram Notation

| Symbol | Meaning |
|--------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |
| `1:N` | One-to-many relationship |
| `1:0..1` | One-to-zero-or-one relationship (optional) |
| `0..1` | Optional (zero or one) |
| `N` | Many |
| `✅` | Access permitted |
| `—` | Access not applicable |

## Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| **DFD** | Data Flow Diagram |
| **ERD** | Entity Relationship Diagram |
| **UC** | Use Case |
| **BR** | Business Rule |
| **CRUD** | Create, Read, Update, Delete |
| **ID** | Identifier |
| **DTO** | Data Transfer Object |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **SAST** | Static Application Security Testing |
| **DAST** | Dynamic Application Security Testing |
| **OWASP** | Open Worldwide Application Security Project |
| **RBAC** | Role-Based Access Control |
