# DFD — Level 0: Context Diagram

The context diagram shows the Cerios Clinic system as a single process interacting with external entities (users and external systems).

## Diagram

```mermaid
flowchart TB
    subgraph External ["External Entities"]
        PATIENT["🧑 Patient"]
        DOCTOR["👨‍⚕️ Doctor"]
        ASSISTANT["👩‍💼 Assistant"]
        ADMIN["🔧 Admin"]
    end

    subgraph System ["Cerios Clinic System"]
        PROCESS["1.0 Clinic Management System"]
    end

    subgraph ExternalSystems ["External Systems"]
        KEYCLOAK["🔐 Keycloak\n(Authentication)"]
        EMAIL["📧 Email Service\n(Mailpit)"]
        DB[(("🗄️ PostgreSQL\nDatabase"))]
    end

    PATIENT -- "F1: Book Appointment\nF2: View Prescriptions\nF3: Submit Review" --> PROCESS
    DOCTOR -- "F4: Manage Schedule\nF5: Create Prescription\nF6: View Patients" --> PROCESS
    ASSISTANT -- "F7: Manage Appointments\nF8: View Patient Data" --> PROCESS
    ADMIN -- "F9: Manage Users\nF10: Feature Toggles" --> PROCESS

    PROCESS -- "F11: Authenticate\nF12: Sync Users" --> KEYCLOAK
    PROCESS -- "F13: Send Notifications" --> EMAIL
    PROCESS -- "F14: CRUD Operations" --> DB

    PROCESS -- "F15: Auth Tokens" --> PATIENT
    PROCESS -- "F15: Auth Tokens" --> DOCTOR
    PROCESS -- "F15: Auth Tokens" --> ASSISTANT
    PROCESS -- "F15: Auth Tokens" --> ADMIN

    style System fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style ExternalSystems fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style External fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
```

## Data Flows

| ID | Flow | From | To | Description |
|----|------|------|-----|-------------|
| F1 | Book Appointment | Patient | System | Patient submits appointment request |
| F2 | View Prescriptions | Patient | System | Patient retrieves medication orders |
| F3 | Submit Review | Patient | System | Patient rates doctor consultation |
| F4 | Manage Schedule | Doctor | System | Doctor sets availability and views calendar |
| F5 | Create Prescription | Doctor | System | Doctor issues medication orders |
| F6 | View Patients | Doctor | System | Doctor accesses patient records |
| F7 | Manage Appointments | Assistant | System | Assistant creates/modifies appointments |
| F8 | View Patient Data | Assistant | System | Assistant accesses patient information |
| F9 | Manage Users | Admin | System | Admin creates/modifies/deactivates users |
| F10 | Feature Toggles | Admin | System | Admin enables/disables features |
| F11 | Authenticate | System | Keycloak | User login and token validation |
| F12 | Sync Users | System | Keycloak | User creation and role assignment |
| F13 | Send Notifications | System | Email | Appointment confirmations, reminders |
| F14 | CRUD Operations | System | Database | All data persistence operations |
| F15 | Auth Tokens | System | Users | JWT tokens for authenticated sessions |

## External Entity Descriptions

### Patient
- Registers account and logs in via Keycloak
- Books, views, and cancels appointments
- Views prescriptions issued by doctors
- Submits reviews after completed appointments
- Manages personal profile (phone, insurance, date of birth)

### Doctor
- Manages availability schedule
- Views patient list and patient details
- Creates and manages prescriptions
- Views reviews received from patients
- Updates appointment status (confirm, complete, cancel)

### Assistant (Reception Staff)
- Creates appointments on behalf of patients
- Modifies existing appointments (reschedule, cancel)
- Views patient data for administrative purposes
- Manages appointment workflow

### Admin
- Creates and manages doctor, assistant, and admin accounts
- Enables/disables feature toggles
- Monitors system health
- Manages system-wide settings

### Keycloak (External System)
- Identity provider for authentication
- Manages user credentials and roles
- Issues JWT tokens for API access
- Supports user federation and synchronization

### Email Service (Mailpit)
- Receives outbound email notifications
- Used for appointment confirmations and reminders
- In development: captured by Mailpit for testing

## Scope Boundaries

**In Scope:**
- Appointment management
- Prescription management
- Review/feedback system
- Doctor availability management
- User profile management
- Feature toggle administration

**Out of Scope:**
- Billing and payment processing
- Laboratory results management
- Medical imaging (X-rays, MRIs)
- Inventory management
- Staff scheduling (beyond doctor availability)
- Insurance claim processing
