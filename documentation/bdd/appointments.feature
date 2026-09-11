@appointments
Feature: Appointment Management
  As a patient, doctor, or assistant
  I want to book, view, cancel, reschedule, confirm, and complete appointments
  So that consultations are scheduled and tracked through their lifecycle

  Background:
    Given the system has a doctor "Dr. Sarah Chen" with specialization "Cardiology"
    And the system has a patient "Anna de Vries"
    And the doctor has no unavailability periods

  # UC-01: Book Appointment (BR-APT-01..04)
  @uc-01 @high
  Scenario: Patient books an appointment in an available slot
    Given the patient is authenticated
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects a future date and an available time slot
    And the patient adds notes "First consultation"
    Then the appointment is created with status "SCHEDULED"
    And the status change is logged in the appointment history
    And a confirmation notification is sent to the patient
    And the confirmation is displayed to the patient

  @uc-01 @high
  Scenario: Patient books an appointment in an already booked slot
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" already has an appointment at "2026-10-05 09:00"
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects the time slot "2026-10-05 09:00"
    Then the system displays the error "This time slot is no longer available"
    And the system shows the available slots again

  @uc-01 @high
  Scenario: Patient books an appointment during doctor unavailability
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" is unavailable from "2026-10-12" to "2026-10-16"
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects the date "2026-10-14"
    Then the system displays the error "Doctor is not available during this period"
    And the system shows the available slots again

  @uc-01 @high
  Scenario: Patient books an appointment in the past
    Given the patient is authenticated
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects a date in the past
    Then the system displays the error "Cannot book appointments in the past"

  @uc-01 @high
  Scenario: Assistant books an appointment on behalf of a patient
    Given the assistant is authenticated
    When the assistant selects patient "Anna de Vries"
    And the assistant selects doctor "Dr. Sarah Chen"
    And the assistant selects a future date and an available time slot
    Then the appointment is created with status "SCHEDULED"
    And a confirmation notification is sent to the patient

  @uc-01 @high
  Scenario: Patient cannot book an appointment for another patient
    Given the patient is authenticated
    When the patient attempts to book an appointment for another patient
    Then the system rejects the booking
    And the system displays an authorization error

  # UC-02: View Appointments
  @uc-02 @high
  Scenario: Patient views only their own appointments
    Given the patient is authenticated
    And the patient has 2 appointments
    And another patient has 1 appointment
    When the patient navigates to the appointments view
    Then the system displays only the 2 appointments of the patient
    And each appointment shows date, time, doctor name, and status

  @uc-02 @high
  Scenario: Doctor views appointments where they are the doctor
    Given the doctor is authenticated
    And the doctor has 3 appointments
    And another doctor has 2 appointments
    When the doctor navigates to the appointments view
    Then the system displays only the 3 appointments of the doctor

  @uc-02 @high
  Scenario: Assistant views all appointments
    Given the assistant is authenticated
    And the system has 5 appointments in total
    When the assistant navigates to the appointments view
    Then the system displays all 5 appointments

  @uc-02 @high
  Scenario: Admin views all appointments
    Given the admin is authenticated
    And the system has 5 appointments in total
    When the admin navigates to the appointments view
    Then the system displays all 5 appointments

  @uc-02 @high
  Scenario: Filter appointments by status
    Given the assistant is authenticated
    And the system has 3 "SCHEDULED" and 2 "COMPLETED" appointments
    When the assistant filters the appointments by status "COMPLETED"
    Then the system displays only the 2 "COMPLETED" appointments

  @uc-02 @high
  Scenario: No appointments found
    Given the patient is authenticated
    And the patient has no appointments
    When the patient navigates to the appointments view
    Then the system displays the message "No appointments found"

  # UC-03: Cancel Appointment
  @uc-03 @high
  Scenario: Patient cancels a scheduled appointment
    Given the patient is authenticated
    And the patient has an appointment with status "SCHEDULED"
    When the patient selects the appointment to cancel
    And the patient confirms the cancellation
    Then the appointment status changes to "CANCELLED"
    And the status change is logged in the appointment history
    And a cancellation notification is sent to the patient

  @uc-03 @high
  Scenario: Patient aborts the cancellation confirmation
    Given the patient is authenticated
    And the patient has an appointment with status "SCHEDULED"
    When the patient selects the appointment to cancel
    And the patient aborts the confirmation dialog
    Then the appointment status remains "SCHEDULED"
    And the patient is returned to the appointment list

  @uc-03 @high
  Scenario: Cannot cancel a completed appointment
    Given the doctor is authenticated
    And the doctor has an appointment with status "COMPLETED"
    When the doctor attempts to cancel the appointment
    Then the system displays the error "Cannot cancel a completed appointment"

  @uc-03 @high
  Scenario: Cannot cancel an already cancelled appointment
    Given the patient is authenticated
    And the patient has an appointment with status "CANCELLED"
    When the patient attempts to cancel the appointment
    Then the system displays the error "Appointment is already cancelled"

  # UC-04: Reschedule Appointment
  @uc-04 @medium
  Scenario: Assistant reschedules an appointment to an available slot
    Given the assistant is authenticated
    And an appointment exists with status "SCHEDULED"
    When the assistant selects the appointment to reschedule
    And the assistant selects a new future date and an available time slot
    Then the appointment's scheduled time is updated
    And the change is logged in the appointment history
    And the system displays a confirmation

  @uc-04 @medium
  Scenario: Assistant reschedules an appointment to an unavailable slot
    Given the assistant is authenticated
    And an appointment exists with status "SCHEDULED"
    When the assistant selects the appointment to reschedule
    And the assistant selects a time slot that is already booked
    Then the system displays an error
    And the system returns to the slot selection

  @uc-04 @medium
  Scenario: Assistant reschedules an appointment during doctor unavailability
    Given the assistant is authenticated
    And an appointment exists with status "SCHEDULED"
    And doctor "Dr. Sarah Chen" is unavailable from "2026-11-02" to "2026-11-06"
    When the assistant selects the appointment to reschedule
    And the assistant selects the date "2026-11-04"
    Then the system displays an error
    And the system returns to the slot selection

  # UC-05: Confirm Appointment
  @uc-05 @medium
  Scenario: Doctor confirms a scheduled appointment
    Given the doctor is authenticated
    And the doctor has an appointment with status "SCHEDULED"
    When the doctor selects the appointment
    And the doctor confirms the appointment
    Then the appointment status changes to "CONFIRMED"
    And the status change is logged in the appointment history

  @uc-05 @medium
  Scenario: Assistant confirms a scheduled appointment
    Given the assistant is authenticated
    And an appointment exists with status "SCHEDULED"
    When the assistant selects the appointment
    And the assistant confirms the appointment
    Then the appointment status changes to "CONFIRMED"

  # UC-06: Complete Appointment
  @uc-06 @high
  Scenario: Doctor completes a confirmed appointment
    Given the doctor is authenticated
    And the doctor has an appointment with status "CONFIRMED"
    When the doctor selects the appointment
    And the doctor marks the appointment as completed
    Then the appointment status changes to "COMPLETED"
    And the status change is logged in the appointment history
    And review submission is enabled for the patient
    And prescription creation is enabled for the doctor

  @uc-06 @high
  Scenario: Only the assigned doctor can complete an appointment
    Given doctor "Dr. Sarah Chen" is authenticated
    And doctor "Dr. Mark Johnson" has an appointment with status "CONFIRMED"
    When doctor "Dr. Sarah Chen" attempts to complete the appointment
    Then the system rejects the action
    And the system displays an authorization error

  # State transition coverage (DFD-Level1 status rules, ERD allowed transitions)
  @uc-05 @uc-06 @state-transition
  Scenario Outline: Allowed appointment status transitions
    Given an appointment exists with status "<from>"
    When the <actor> performs the action "<action>"
    Then the appointment status becomes "<to>"
    And the status change is logged with the actor's keycloak ID

    Examples:
      | from       | actor     | action   | to        |
      | SCHEDULED  | doctor    | confirm  | CONFIRMED |
      | SCHEDULED  | patient   | cancel   | CANCELLED |
      | SCHEDULED  | doctor    | cancel   | CANCELLED |
      | SCHEDULED  | assistant | cancel   | CANCELLED |
      | CONFIRMED  | doctor    | complete | COMPLETED |
      | CONFIRMED  | patient   | cancel   | CANCELLED |
      | CONFIRMED  | doctor    | cancel   | CANCELLED |
      | CONFIRMED  | assistant | cancel   | CANCELLED |

  @uc-03 @uc-06 @state-transition
  Scenario Outline: Terminal appointment states reject further transitions
    Given an appointment exists with status "<terminal>"
    When the <actor> attempts to change the appointment status
    Then the system rejects the transition
    And the system displays an error

    Examples:
      | terminal  | actor  |
      | COMPLETED | doctor |
      | CANCELLED | doctor |
      | CANCELLED | patient |