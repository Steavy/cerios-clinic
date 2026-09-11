@availability
Feature: Availability Management
  As a doctor
  I want to set unavailability periods and let patients view my available slots
  So that patients only book appointments when I am available

  Background:
    Given the system has a doctor "Dr. Sarah Chen" with specialization "Cardiology"
    And the system has a patient "Anna de Vries"

  # UC-12: Set Unavailability (BR-AVL-01..05)
  @uc-12 @medium
  Scenario: Doctor sets an unavailability period
    Given the doctor is authenticated
    When the doctor navigates to the availability settings
    And the doctor selects start date "2026-12-21" and end date "2026-12-25"
    And the doctor enters a reason "Vacation"
    And the doctor saves the unavailability period
    Then the unavailability period is recorded
    And the system displays a confirmation

  @uc-12 @medium
  Scenario: Doctor sets an unavailability period without a reason
    Given the doctor is authenticated
    When the doctor navigates to the availability settings
    And the doctor selects start date "2026-12-21" and end date "2026-12-25"
    And the doctor saves the unavailability period without a reason
    Then the unavailability period is recorded

  @uc-12 @medium
  Scenario: Doctor sets an unavailability period with start date after end date
    Given the doctor is authenticated
    When the doctor selects start date "2026-12-25" and end date "2026-12-21"
    And the doctor saves the unavailability period
    Then the system displays the error "Start date must be before or equal to end date"
    And no unavailability period is recorded

  @uc-12 @medium
  Scenario: Doctor sets an unavailability period in the past
    Given the doctor is authenticated
    When the doctor selects start date "2026-08-01" and end date "2026-08-05"
    And the doctor saves the unavailability period
    Then the system displays the error "Cannot set unavailability in the past"
    And no unavailability period is recorded

  @uc-12 @medium
  Scenario: Setting unavailability does not cancel existing appointments
    Given the doctor is authenticated
    And the doctor has an appointment with status "SCHEDULED" on "2026-12-22"
    When the doctor sets an unavailability period from "2026-12-21" to "2026-12-25"
    Then the existing appointment on "2026-12-22" remains "SCHEDULED"

  @uc-12 @medium
  Scenario: Only the doctor themselves can manage their availability
    Given doctor "Dr. Sarah Chen" is authenticated
    When doctor "Dr. Sarah Chen" attempts to set an unavailability period for doctor "Dr. Mark Johnson"
    Then the system rejects the action
    And the system displays an authorization error

  # UC-13: View Doctor Availability
  @uc-13 @high
  Scenario: Patient views available slots for a doctor
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" has no appointments and no unavailability on "2026-10-05"
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects the date "2026-10-05"
    Then the system displays all generated time slots for the day

  @uc-13 @high
  Scenario: Available slots exclude booked appointments
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" has an appointment at "2026-10-05 09:00"
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects the date "2026-10-05"
    Then the system does not display the slot "2026-10-05 09:00"

  @uc-13 @high
  Scenario: Available slots exclude unavailability periods
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" is unavailable from "2026-10-05" to "2026-10-05"
    When the patient selects doctor "Dr. Sarah Chen"
    And the patient selects the date "2026-10-05"
    Then the system displays no available slots for the day

  @uc-13 @high
  Scenario: Patient can book from an available slot
    Given the patient is authenticated
    And doctor "Dr. Sarah Chen" has an available slot on "2026-10-05 10:00"
    When the patient selects the available slot "2026-10-05 10:00"
    Then the booking flow for the slot starts