@prescriptions
Feature: Prescription Management
  As a doctor
  I want to create, view, and update prescriptions linked to completed appointments
  So that patients receive medication orders with clear dosage instructions

  Background:
    Given the system has a doctor "Dr. Sarah Chen" with specialization "Cardiology"
    And the system has a patient "Anna de Vries"
    And the doctor has a completed appointment with the patient

  # UC-07: Create Prescription (BR-RX-01..05)
  @uc-07 @high
  Scenario: Doctor creates a prescription with medication items
    Given the doctor is authenticated
    And the doctor has a completed appointment without a prescription
    When the doctor selects the completed appointment
    And the doctor enters notes "Take with food"
    And the doctor adds a medication item with name "Amoxicillin", dosage "500mg", frequency "3x daily", duration "7 days"
    And the doctor saves the prescription
    Then a prescription is created for the appointment
    And the prescription contains the medication item
    And a notification is sent to the patient

  @uc-07 @high
  Scenario: Doctor creates a prescription with multiple medication items
    Given the doctor is authenticated
    And the doctor has a completed appointment without a prescription
    When the doctor selects the completed appointment
    And the doctor adds 2 medication items
    And the doctor saves the prescription
    Then a prescription is created with 2 medication items

  @uc-07 @high
  Scenario: Cannot create a prescription for an appointment that is not completed
    Given the doctor is authenticated
    And the doctor has an appointment with status "CONFIRMED"
    When the doctor attempts to create a prescription for the appointment
    Then the system displays an error
    And no prescription is created

  @uc-07 @high
  Scenario: Cannot create a second prescription for the same appointment
    Given the doctor is authenticated
    And the doctor has a completed appointment with an existing prescription
    When the doctor attempts to create another prescription for the appointment
    Then the system displays the error "Prescription already exists for this appointment"

  @uc-07 @high
  Scenario: Cannot create a prescription without medication items
    Given the doctor is authenticated
    And the doctor has a completed appointment without a prescription
    When the doctor selects the completed appointment
    And the doctor saves the prescription without adding any medication items
    Then the system displays an error
    And no prescription is created

  @uc-07 @high
  Scenario: Cannot create a prescription with incomplete medication item fields
    Given the doctor is authenticated
    And the doctor has a completed appointment without a prescription
    When the doctor adds a medication item without a dosage
    And the doctor saves the prescription
    Then the system displays an error
    And no prescription is created

  @uc-07 @high
  Scenario: Only the owning doctor can create a prescription
    Given doctor "Dr. Sarah Chen" is authenticated
    And doctor "Dr. Mark Johnson" has a completed appointment without a prescription
    When doctor "Dr. Sarah Chen" attempts to create a prescription for the appointment
    Then the system rejects the action
    And the system displays an authorization error

  # UC-08: View Prescription
  @uc-08 @medium
  Scenario: Patient views their own prescriptions
    Given the patient is authenticated
    And the patient has 2 prescriptions
    And another patient has 1 prescription
    When the patient navigates to the prescriptions view
    Then the system displays only the 2 prescriptions of the patient

  @uc-08 @medium
  Scenario: Doctor views prescriptions for their appointments
    Given the doctor is authenticated
    And the doctor has 3 prescriptions for their appointments
    And another doctor has 2 prescriptions
    When the doctor navigates to the prescriptions view
    Then the system displays only the 3 prescriptions of the doctor

  @uc-08 @medium
  Scenario: Assistant views all prescriptions
    Given the assistant is authenticated
    And the system has 4 prescriptions in total
    When the assistant navigates to the prescriptions view
    Then the system displays all 4 prescriptions

  @uc-08 @medium
  Scenario: View prescription details
    Given the patient is authenticated
    And the patient has a prescription with 2 medication items
    When the patient selects the prescription
    Then the system displays the appointment info, medication items, notes, and dates

  # UC-09: Update Prescription
  @uc-09 @low
  Scenario: Doctor updates prescription notes and items
    Given the doctor is authenticated
    And the doctor owns a prescription with 1 medication item
    When the doctor selects the prescription
    And the doctor modifies the notes and adds a medication item
    And the doctor saves the changes
    Then the prescription is updated with the new notes and 2 medication items

  @uc-09 @low
  Scenario: Doctor cannot update a prescription they do not own
    Given doctor "Dr. Sarah Chen" is authenticated
    And doctor "Dr. Mark Johnson" owns a prescription
    When doctor "Dr. Sarah Chen" attempts to update the prescription
    Then the system rejects the action
    And the system displays an authorization error

  @uc-09 @low
  Scenario: Patient cannot modify a prescription
    Given the patient is authenticated
    And the patient has a prescription
    When the patient attempts to modify the prescription
    Then the system rejects the action
    And the system displays an authorization error