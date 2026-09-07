# DFD — Level 1: Detailed Processes

Level 1 breaks down the system into its core functional processes, showing data flows between processes, data stores, and external entities.

## Overview Diagram

```mermaid
flowchart TB
    P1["1.1 Appointment\nManagement"]
    P2["1.2 Prescription\nManagement"]
    P3["1.3 Review\nManagement"]
    P4["1.4 Availability\nManagement"]
    P5["1.5 User & Profile\nManagement"]
    P6["1.6 Authentication\n& Authorization"]
    P7["1.7 Feature Toggle\nManagement"]
    P8["1.8 Notification\nService"]

    DS1[("D1: Appointments")]
    DS2[("D2: Prescriptions")]
    DS3[("D3: Reviews")]
    DS4[("D4: Users & Profiles")]
    DS5[("D5: Doctor Availability")]
    DS6[("D6: Feature Toggles")]

    PAT["Patient"]
    DOC["Doctor"]
    ASST["Assistant"]
    ADM["Admin"]
    KC["Keycloak"]
    MAIL["Email Service"]

    PAT --> P1
    PAT --> P3
    PAT --> P5
    DOC --> P1
    DOC --> P2
    DOC --> P4
    DOC --> P5
    ASST --> P1
    ASST --> P5
    ADM --> P5
    ADM --> P7

    P1 --> DS1
    P2 --> DS2
    P3 --> DS3
    P4 --> DS5
    P5 --> DS4
    P7 --> DS6

    P6 --> KC
    P1 --> P8
    P8 --> MAIL

    P1 -- "status change" --> P8
    P2 -- "prescription created" --> P8
```

---

## Process 1.1 — Appointment Management

Handles the full lifecycle of appointments: creation, modification, cancellation, and status tracking.

```mermaid
flowchart LR
    subgraph Inputs
        I1["Book Request\n(Patient)"]
        I2["Create Request\n(Assistant)"]
        I3["Reschedule/Cancel\n(Doctor/Assistant)"]
        I4["View Request\n(Patient/Doctor)"]
    end

    subgraph Process["1.1 Appointment Management"]
        direction TB
        VAL["Validate\nAvailability"]
        CHECK["Check Slot\nConflict"]
        CREATE["Create\nAppointment"]
        STATUS["Update\nStatus"]
        HISTORY["Log Status\nHistory"]
    end

    subgraph Outputs
        O1["Appointment\nConfirmation"]
        O2["Status Change\nNotification"]
        O3["History\nAudit Trail"]
    end

    I1 --> VAL --> CHECK --> CREATE
    I2 --> VAL
    I3 --> STATUS --> HISTORY
    I4 --> CREATE

    CREATE --> O1
    STATUS --> O2
    HISTORY --> O3
```

### Data Flows — Process 1.1

| ID | Flow | Description |
|----|------|-------------|
| F1.1a | Book Request → Validate | Patient submits appointment request with doctor, date, time |
| F1.1b | Create Request → Validate | Assistant creates appointment on behalf of patient |
| F1.1c | Validate → Check Slot | System checks doctor availability for requested slot |
| F1.1d | Check Slot → Create | No conflict found — appointment created with status SCHEDULED |
| F1.1e | Reschedule/Cancel → Update Status | Doctor or assistant changes status or scheduled time |
| F1.1f | Update Status → Log History | Status change recorded in AppointmentStatusChange table |
| F1.1g | Create → Confirmation | Confirmation sent to patient (portal + optional email) |

### Status Transition Rules

```
SCHEDULED ──→ CONFIRMED ──→ COMPLETED
    │              │
    └──→ CANCELLED ←┘
```

- **SCHEDULED → CONFIRMED**: Doctor or assistant confirms the appointment
- **CONFIRMED → COMPLETED**: Doctor marks appointment as completed
- **SCHEDULED → CANCELLED**: Patient, doctor, or assistant cancels
- **CONFIRMED → CANCELLED**: Patient, doctor, or assistant cancels
- **COMPLETED / CANCELLED**: Terminal states — no further transitions

### Business Rules

| Rule | Description |
|------|-------------|
| BR-APT-01 | An appointment must reference an existing patient and doctor |
| BR-APT-02 | The scheduled time must be in the future |
| BR-APT-03 | The doctor must not have a conflicting appointment at the same time |
| BR-APT-04 | The doctor must not have an unavailability period covering the scheduled date |
| BR-APT-05 | Only allowed status transitions are permitted (see shared-types) |
| BR-APT-06 | Every status change is logged with the changer's Keycloak ID and timestamp |

---

## Process 1.2 — Prescription Management

Doctors create, update, and view prescriptions linked to completed appointments.

```mermaid
flowchart LR
    subgraph Inputs
        I1["Create Prescription\n(Doctor)"]
        I2["Update Prescription\n(Doctor)"]
        I3["View Prescription\n(Patient/Doctor)"]
    end

    subgraph Process["1.2 Prescription Management"]
        VALIDATE["Validate\nAppointment"]
        CREATE["Create\nPrescription"]
        ITEMS["Manage\nPrescription Items"]
        LINK["Link to\nAppointment"]
    end

    subgraph Outputs
        O1["Prescription\nDetails"]
        O2["Medication\nList"]
    end

    I1 --> VALIDATE --> CREATE --> ITEMS
    I2 --> ITEMS
    I3 --> LINK --> O1

    ITEMS --> O2
```

### Data Flows — Process 1.2

| ID | Flow | Description |
|----|------|-------------|
| F1.2a | Create Prescription → Validate | Doctor initiates prescription for a completed appointment |
| F1.2b | Validate → Create | System verifies appointment exists and belongs to this doctor |
| F1.2c | Create → Manage Items | Doctor adds medication items (name, dosage, frequency, duration) |
| F1.2d | Update Prescription → Manage Items | Doctor modifies existing prescription items |
| F1.2e | View Prescription → Link to Appointment | Patient or doctor retrieves prescription with appointment context |

### Business Rules

| Rule | Description |
|------|-------------|
| BR-RX-01 | A prescription must be linked to an existing appointment |
| BR-RX-02 | Each appointment can have at most one prescription |
| BR-RX-03 | A prescription must contain at least one medication item |
| BR-RX-04 | Each item must include: medication name, dosage, frequency, duration |
| BR-RX-05 | Only the doctor who owns the appointment can create/modify the prescription |
| BR-RX-06 | Patients can view but not modify prescriptions |

---

## Process 1.3 — Review Management

Patients submit reviews for completed appointments; doctors and assistants can view them.

```mermaid
flowchart LR
    subgraph Inputs
        I1["Submit Review\n(Patient)"]
        I2["View Reviews\n(Doctor/Patient)"]
    end

    subgraph Process["1.3 Review Management"]
        CHECK["Check Eligibility\n(Completed Appt)"]
        CREATE["Create\nReview"]
        AGGREGATE["Calculate\nStatistics"]
    end

    subgraph Outputs
        O1["Review\nConfirmation"]
        O2["Doctor\nStatistics"]
        O3["Review\nDetails"]
    end

    I1 --> CHECK --> CREATE
    CREATE --> AGGREGATE
    I2 --> AGGREGATE

    CREATE --> O1
    AGGREGATE --> O2
    AGGREGATE --> O3
```

### Data Flows — Process 1.3

| ID | Flow | Description |
|----|------|-------------|
| F1.3a | Submit Review → Check Eligibility | Patient submits review for a specific appointment |
| F1.3b | Check → Create | System verifies appointment is COMPLETED and has no existing review |
| F1.3c | Create → Calculate Statistics | New review triggers recalculation of doctor's average rating |
| F1.3d | View Reviews → Statistics | Doctor or patient retrieves review data with aggregated stats |

### Business Rules

| Rule | Description |
|------|-------------|
| BR-REV-01 | Reviews can only be submitted for appointments with status COMPLETED |
| BR-REV-02 | Each appointment can have at most one review |
| BR-REV-03 | Only the patient who owned the appointment can submit a review |
| BR-REV-04 | Rating must be an integer (1–5 scale implied) |
| BR-REV-05 | Comment is optional |
| BR-REV-06 | Doctors can view reviews but not modify or delete them |

---

## Process 1.4 — Availability Management

Doctors define periods of unavailability (vacation, conferences, etc.).

```mermaid
flowchart LR
    subgraph Inputs
        I1["Set Unavailability\n(Doctor)"]
        I2["Remove Period\n(Doctor)"]
        I3["Check Availability\n(System)"]
    end

    subgraph Process["1.4 Availability Management"]
        CREATE["Create\nUnavailability"]
        VALIDATE["Validate\nDates"]
        CHECK["Check\nConflicts"]
    end

    subgraph Outputs
        O1["Availability\nConfirmation"]
        O2["Conflict\nAlert"]
    end

    I1 --> VALIDATE --> CREATE
    I2 --> CREATE
    I3 --> CHECK

    CREATE --> O1
    CHECK --> O2
```

### Data Flows — Process 1.4

| ID | Flow | Description |
|----|------|-------------|
| F1.4a | Set Unavailability → Validate | Doctor specifies start and end date for unavailability |
| F1.4b | Validate → Create | System validates dates (start ≤ end, not in past) |
| F1.4c | Check Availability → Conflict Alert | System checks for existing appointments during the period |

### Business Rules

| Rule | Description |
|------|-------------|
| BR-AVL-01 | Start date must be on or before end date |
| BR-AVL-02 | The unavailability period must not be in the past |
| BR-AVL-03 | Only the doctor themselves can manage their availability |
| BR-AVL-04 | Reason is optional (e.g., "Vacation", "Conference") |
| BR-AVL-05 | Setting unavailability does NOT auto-cancel existing appointments |

---

## Process 1.5 — User & Profile Management

Handles user registration, profile updates, and role-specific data management.

```mermaid
flowchart LR
    subgraph Inputs
        I1["Register\n(Patient via Keycloak)"]
        I2["Create User\n(Admin: Doctor/Assistant)"]
        I3["Update Profile\n(Any User)"]
        I4["View Profile\n(Own Profile)"]
    end

    subgraph Process["1.5 User & Profile Management"]
        SYNC["Sync with\nKeycloak"]
        CREATE_USER["Create\nUser Record"]
        UPDATE["Update\nProfile"]
        VALIDATE["Validate\nRole Data"]
    end

    subgraph Outputs
        O1["Profile\nConfirmation"]
        O2["User Created\nConfirmation"]
    end

    I1 --> SYNC --> CREATE_USER
    I2 --> VALIDATE --> CREATE_USER
    I3 --> UPDATE
    I4 --> UPDATE

    CREATE_USER --> O2
    UPDATE --> O1
```

### Data Flows — Process 1.5

| ID | Flow | Description |
|----|------|-------------|
| F1.5a | Register → Sync | New patient self-registers via Keycloak |
| F1.5b | Sync → Create User Record | System creates User + Patient records from Keycloak data |
| F1.5c | Create User → Validate | Admin creates doctor or assistant account |
| F1.5d | Validate → Create User Record | System creates User + role-specific record (Doctor/Assistant) |
| F1.5e | Update Profile → Update | User modifies own profile data |
| F1.5f | View Profile → Update | User retrieves current profile information |

### Business Rules

| Rule | Description |
|------|-------------|
| BR-USR-01 | Patient self-registration is handled by Keycloak; system syncs on first login |
| BR-USR-02 | Only admins can create doctor and assistant accounts |
| BR-USR-03 | Email must be unique across all users |
| BR-USR-04 | Each user has exactly one role-specific record (Patient/Doctor/Assistant) |
| BR-USR-05 | Profile updates sync to Keycloak where applicable (name, email) |
| BR-USR-06 | Soft-deleted users retain their data but are excluded from active queries |

---

## Process 1.6 — Authentication & Authorization

Keycloak integration for login, token validation, and role-based access control.

```mermaid
flowchart LR
    subgraph Inputs
        I1["Login Request\n(Any User)"]
        I2["API Request\n(Any User)"]
    end

    subgraph Process["1.6 Authentication"]
        AUTHENTICATE["Authenticate\nCredentials"]
        TOKEN["Issue JWT\nToken"]
        VALIDATE["Validate\nToken"]
        CHECK_ROLE["Check\nRole Access"]
    end

    subgraph Outputs
        O1["Access Token"]
        O2["Granted"]
        O3["401/403\nDenied"]
    end

    I1 --> AUTHENTICATE --> TOKEN --> O1
    I2 --> VALIDATE --> CHECK_ROLE
    CHECK_ROLE -- "valid role" --> O2
    CHECK_ROLE -- "wrong role" --> O3
```

### Data Flows — Process 1.6

| ID | Flow | Description |
|----|------|-------------|
| F1.6a | Login → Authenticate | User submits credentials to Keycloak |
| F1.6b | Authenticate → Token | Keycloak validates and issues JWT with role claim |
| F1.6c | API Request → Validate | API verifies JWT signature and expiration |
| F1.6d | Validate → Check Role | API extracts role from token and checks endpoint permission |
| F1.6e | Check Role → Granted/Denied | Access allowed or rejected based on role |

### API Endpoint Access Matrix

| Endpoint Domain | Patient | Doctor | Assistant | Admin |
|-----------------|---------|--------|-----------|-------|
| Appointments (own) | ✅ | ✅ | ✅ | — |
| Appointments (all) | — | — | ✅ | ✅ |
| Prescriptions (own) | ✅ | ✅ | — | — |
| Reviews (own) | ✅ | ✅ | — | — |
| Doctor Availability | ✅ (read) | ✅ (write) | — | — |
| User Management | — | — | — | ✅ |
| Feature Toggles | — | — | — | ✅ |

---

## Process 1.7 — Feature Toggle Management

Admins control runtime feature flags for gradual rollouts and bug workarounds.

### Data Flows — Process 1.7

| ID | Flow | Description |
|----|------|-------------|
| F1.7a | Toggle Request → Update | Admin enables/disables a feature flag |
| F1.7b | Config Update → Store | Admin modifies toggle configuration (e.g., delay ranges) |
| F1.7c | API Request → Check Flag | API checks feature toggle before executing behavior |

### Known Feature Toggles

| Key | Purpose | Config |
|-----|---------|--------|
| `bug:api-slowdown` | Simulates API latency for testing | `{ minDelayMs, maxDelayMs }` |
| `bug:same-day-restriction` | Restricts same-day appointments | — |
| `bug:profile-validation-frontend` | Enables frontend profile validation bug | — |
| `bug:profile-validation-backend` | Enables backend profile validation bug | — |
| `bug:show-footer-logo` | Toggles footer logo visibility | — |

---

## Process 1.8 — Notification Service

Sends email notifications for appointment lifecycle events.

### Data Flows — Process 1.8

| ID | Flow | Description |
|----|------|-------------|
| F1.8a | Appointment Created → Send | Confirmation email sent to patient |
| F1.8b | Status Changed → Send | Status update notification sent to patient |
| F1.8c | Prescription Created → Send | Prescription ready notification sent to patient |

### Business Rules

| Rule | Description |
|------|-------------|
| BR-NOT-01 | Notifications respect patient's `emailNotificationsEnabled` preference |
| BR-NOT-02 | In development, all emails are captured by Mailpit (port 8025) |
| BR-NOT-03 | Notifications are sent asynchronously via the events system |

---

## Cross-Process Data Flows

```mermaid
flowchart LR
    P1["1.1 Appointments"] -- "appointment completed" --> P2["1.2 Prescriptions"]
    P1 -- "appointment completed" --> P3["1.3 Reviews"]
    P1 -- "slot check" --> P4["1.4 Availability"]
    P1 -- "status change event" --> P8["1.8 Notifications"]
    P2 -- "prescription event" --> P8
    P5["1.5 Users"] -- "user context" --> P1
    P6["1.6 Auth"] -- "auth context" --> P1
    P6 -- "auth context" --> P5
    P7["1.7 Feature Toggles"] -- "toggle check" --> P1
    P7 -- "toggle check" --> P2
```
