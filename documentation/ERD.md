# Entity Relationship Diagram (ERD)

This document describes the database schema for Cerios Clinic, derived from the Prisma schema (`packages/database/prisma/schema.prisma`).

## ER Diagram

```mermaid
erDiagram
    USER {
        string id PK
        string keycloak_id UK
        string email UK
        string first_name
        string last_name
        string role
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    PATIENT {
        string id PK
        string user_id FK, UK
        datetime date_of_birth
        string phone
        string insurance_number
        string photo
        boolean email_notifications_enabled
        datetime updated_at
    }

    DOCTOR {
        string id PK
        string user_id FK, UK
        string specialization
        string license_number
        datetime updated_at
    }

    ASSISTANT {
        string id PK
        string user_id FK, UK
        string department
        datetime updated_at
    }

    APPOINTMENT {
        string id PK
        string patient_id FK
        string doctor_id FK
        string assistant_id FK
        datetime scheduled_at
        string status
        string notes
        datetime created_at
        datetime updated_at
    }

    APPOINTMENT_STATUS_CHANGE {
        string id PK
        string appointment_id FK
        string previous_status
        string new_status
        datetime previous_scheduled_at
        datetime new_scheduled_at
        string changed_by_keycloak_id
        datetime changed_at
    }

    REVIEW {
        string id PK
        string appointment_id FK, UK
        string patient_id FK
        string doctor_id FK
        int rating
        string comment
        datetime created_at
    }

    PRESCRIPTION {
        string id PK
        string appointment_id FK, UK
        string patient_id FK
        string doctor_id FK
        string notes
        datetime created_at
        datetime updated_at
    }

    PRESCRIPTION_ITEM {
        string id PK
        string prescription_id FK
        string medication_name
        string dosage
        string frequency
        string duration
        string instructions
    }

    DOCTOR_UNAVAILABILITY {
        string id PK
        string doctor_id FK
        datetime start_date
        datetime end_date
        string reason
        datetime created_at
    }

    FEATURE_TOGGLE {
        string id PK
        string key UK
        boolean enabled
        string description
        string config
        datetime created_at
        datetime updated_at
    }

    USER ||--o| PATIENT : "has profile"
    USER ||--o| DOCTOR : "has profile"
    USER ||--o| ASSISTANT : "has profile"

    PATIENT ||--o{ APPOINTMENT : "books"
    DOCTOR ||--o{ APPOINTMENT : "conducts"
    ASSISTANT ||--o{ APPOINTMENT : "manages"

    APPOINTMENT ||--o{ APPOINTMENT_STATUS_CHANGE : "has history"
    APPOINTMENT ||--o| REVIEW : "receives"
    APPOINTMENT ||--o| PRESCRIPTION : "generates"

    PATIENT ||--o{ REVIEW : "writes"
    DOCTOR ||--o{ REVIEW : "receives"

    PATIENT ||--o{ PRESCRIPTION : "receives"
    DOCTOR ||--o{ PRESCRIPTION : "issues"
    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : "contains"

    DOCTOR ||--o{ DOCTOR_UNAVAILABILITY : "defines"
```

## Enumerations

### UserRole

| Value | Description |
|-------|-------------|
| `patient` | Patient — can book appointments, view prescriptions, submit reviews |
| `doctor` | Doctor — manages schedule, creates prescriptions, views patients |
| `assistant` | Assistant — reception staff managing appointments |
| `admin` | Administrator — system-wide user and feature management |

### AppointmentStatus

| Value | Description | Terminal |
|-------|-------------|----------|
| `SCHEDULED` | Initial state after appointment creation | No |
| `CONFIRMED` | Doctor or assistant has confirmed the appointment | No |
| `COMPLETED` | Appointment has been conducted | Yes |
| `CANCELLED` | Appointment has been cancelled | Yes |

### Allowed Status Transitions

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED
    SCHEDULED --> CONFIRMED : confirm
    SCHEDULED --> CANCELLED : cancel
    CONFIRMED --> COMPLETED : complete
    CONFIRMED --> CANCELLED : cancel
    COMPLETED --> [*]
    CANCELLED --> [*]
```

## Entity Descriptions

### User
Central identity record linked to Keycloak. Every person in the system (patient, doctor, assistant, admin) has a User record. Supports soft deletion via `deleted_at`.

**Key fields:**
- `keycloak_id` — External identity provider reference (unique)
- `role` — Determines portal access and API permissions

### Patient
Extended profile for patients. One-to-one relationship with User.

**Key fields:**
- `date_of_birth` — Used for age-based eligibility checks
- `insurance_number` — Insurance reference (optional)
- `photo` — Profile photo path
- `email_notifications_enabled` — Opt-in/out for email notifications

### Doctor
Extended profile for doctors. One-to-one relationship with User.

**Key fields:**
- `specialization` — Medical specialty (e.g., "Cardiology", "General Practice")
- `license_number` — Medical license reference

### Assistant
Extended profile for reception staff. One-to-one relationship with User.

**Key fields:**
- `department` — Department assignment (e.g., "Reception", "Cardiology Wing")

### Appointment
Core entity linking a patient, doctor, and optional assistant for a specific time slot.

**Key fields:**
- `scheduled_at` — Date and time of the appointment
- `status` — Current lifecycle state (see AppointmentStatus)
- `notes` — Optional free-text notes

**Indexes:**
- `patient_id` — Fast lookup of patient's appointments
- `doctor_id` — Fast lookup of doctor's schedule
- `scheduled_at` — Range queries for date-based filtering
- `status` — Filtering by status
- `patient_id + status` — Combined queries (e.g., "patient's upcoming appointments")
- `patient_id + scheduled_at` — Patient timeline queries
- `doctor_id + scheduled_at` — Doctor calendar queries

### AppointmentStatusChange
Immutable audit log of every status or schedule change on an appointment.

**Key fields:**
- `previous_status` / `new_status` — The transition that occurred
- `previous_scheduled_at` / `new_scheduled_at` — If rescheduled, the old and new times
- `changed_by_keycloak_id` — Who made the change

### Review
Patient feedback on a completed appointment. One-to-one with Appointment.

**Key fields:**
- `rating` — Numeric rating
- `comment` — Optional text feedback

### Prescription
Medication order issued by a doctor for a specific appointment. One-to-one with Appointment.

**Key fields:**
- `notes` — Doctor's general notes
- `items` — List of individual medications (see PrescriptionItem)

### PrescriptionItem
Individual medication within a prescription. Cascade-deletes when the parent prescription is removed.

**Key fields:**
- `medication_name` — Name of the medication
- `dosage` — Dosage instructions (e.g., "500mg")
- `frequency` — How often (e.g., "3x daily")
- `duration` — Treatment duration (e.g., "7 days")
- `instructions` — Additional instructions (optional)

### DoctorUnavailability
Period during which a doctor cannot accept appointments.

**Key fields:**
- `start_date` / `end_date` — Unavailability window
- `reason` — Optional explanation (e.g., "Vacation")

**Composite index:** `(doctor_id, start_date, end_date)` — Efficient overlap queries.

### FeatureToggle
Runtime feature flags managed by admins. Used for controlled rollouts and bug simulation.

**Key fields:**
- `key` — Unique identifier (e.g., `bug:api-slowdown`)
- `enabled` — Whether the feature is active
- `config` — JSON configuration (e.g., `{ minDelayMs: 1000, maxDelayMs: 5000 }`)

## Relationship Summary

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| User → Patient/Doctor/Assistant | 1:0..1 | Each user has at most one role profile |
| Patient → Appointments | 1:N | A patient can have many appointments |
| Doctor → Appointments | 1:N | A doctor can have many appointments |
| Assistant → Appointments | 1:N | An assistant can manage many appointments |
| Appointment → StatusChanges | 1:N | Each appointment tracks its full history |
| Appointment → Review | 1:0..1 | An appointment may have one review |
| Appointment → Prescription | 1:0..1 | An appointment may have one prescription |
| Prescription → PrescriptionItems | 1:N | A prescription contains one or more medications |
| Doctor → Unavailability | 1:N | A doctor can define many unavailability periods |

## Data Volume Estimates

| Entity | Estimated Volume | Growth Pattern |
|--------|-----------------|----------------|
| Users | 100–500 | Slow (admin-managed) |
| Appointments | 1,000–10,000/year | Linear with patients |
| StatusChanges | 2–5x Appointments | Proportional to appointment edits |
| Reviews | ≤ Appointments | One per completed appointment |
| Prescriptions | ≤ Completed Appointments | One per completed appointment |
| PrescriptionItems | 1–10x Prescriptions | 1–10 medications per prescription |
| DoctorUnavailability | 10–50/year per doctor | Seasonal patterns |
| FeatureToggles | 5–20 | Slow (admin-managed) |
