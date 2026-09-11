@users
Feature: User & Profile Management
  As a user of the clinic
  I want to register, log in, and manage my profile
  So that I can access the system with the correct role and keep my data up to date

  # UC-14: Register Account (BR-USR-01, BR-USR-03)
  @uc-14 @high
  Scenario: Patient registers a new account
    Given no account exists with email "anna@example.com"
    When the patient navigates to the registration page
    And the patient enters email "anna@example.com", first name "Anna", last name "de Vries", and a password
    And the patient submits the registration
    Then a Keycloak account is created
    And a User record with role "patient" is created
    And a Patient record is created
    And the patient can log in

  @uc-14 @high
  Scenario: Registration with an existing email is rejected
    Given an account exists with email "anna@example.com"
    When the patient attempts to register with email "anna@example.com"
    Then the system rejects the registration
    And the system displays an error

  # UC-15: Login
  @uc-15 @high
  Scenario: User logs in with valid credentials
    Given the user has an active account with role "doctor"
    When the user navigates to the doctor portal login page
    And the user enters the correct email and password
    Then Keycloak authenticates the user
    And a JWT token with the role claim "doctor" is issued
    And the user is redirected to the doctor portal
    And the doctor dashboard is displayed

  @uc-15 @high
  Scenario: Login with invalid credentials is rejected
    Given the user has an active account
    When the user enters an incorrect password
    Then Keycloak displays the error "Invalid email or password"
    And no JWT token is issued

  @uc-15 @high
  Scenario: Login of a disabled account is rejected
    Given the user has a disabled account
    When the user attempts to log in
    Then the system displays the error "Account has been disabled"

  # UC-16: View Profile
  @uc-16 @low
  Scenario: Patient views their profile
    Given the patient is authenticated
    When the patient navigates to the profile page
    Then the system displays name, email, date of birth, phone, insurance number, and photo

  @uc-16 @low
  Scenario: Doctor views their profile
    Given the doctor is authenticated
    When the doctor navigates to the profile page
    Then the system displays name, email, specialization, and license number

  @uc-16 @low
  Scenario: Assistant views their profile
    Given the assistant is authenticated
    When the assistant navigates to the profile page
    Then the system displays name, email, and department

  # UC-17: Update Profile (BR-USR-05)
  @uc-17 @medium
  Scenario: Patient updates their profile
    Given the patient is authenticated
    And the patient has a profile with phone "0612345678"
    When the patient navigates to the profile edit page
    And the patient changes the phone to "0698765432"
    And the patient saves the changes
    Then the User and Patient records are updated
    And the system displays a confirmation

  @uc-17 @medium
  Scenario: Profile update with invalid input is rejected
    Given the patient is authenticated
    When the patient enters an invalid date of birth
    And the patient saves the changes
    Then the system displays field-specific validation errors
    And the profile is not updated

  @uc-17 @medium
  Scenario: Doctor updates their specialization
    Given the doctor is authenticated
    When the doctor changes the specialization to "General Practice"
    And the doctor saves the changes
    Then the Doctor record is updated
    And the system displays a confirmation

  # UC-18: Create Staff Account (BR-USR-02, BR-USR-03)
  @uc-18 @high
  Scenario: Admin creates a doctor account
    Given the admin is authenticated
    When the admin navigates to the user management page
    And the admin selects "Create Doctor"
    And the admin enters email, first name, last name, password, specialization "Cardiology", and license number "NL-12345"
    And the admin submits the form
    Then a Keycloak account with role "doctor" is created
    And a User record and a Doctor record are created
    And the system displays a confirmation

  @uc-18 @high
  Scenario: Admin creates an assistant account
    Given the admin is authenticated
    When the admin selects "Create Assistant"
    And the admin enters email, first name, last name, password, and department "Reception"
    And the admin submits the form
    Then a Keycloak account with role "assistant" is created
    And a User record and an Assistant record are created

  @uc-18 @high
  Scenario: Admin cannot create a staff account with an existing email
    Given the admin is authenticated
    And a user exists with email "existing@example.com"
    When the admin attempts to create a staff account with email "existing@example.com"
    Then the system displays the error "A user with this email already exists"
    And no account is created

  @uc-18 @high
  Scenario: Non-admin cannot create staff accounts
    Given the assistant is authenticated
    When the assistant attempts to create a staff account
    Then the system rejects the action
    And the system displays an authorization error