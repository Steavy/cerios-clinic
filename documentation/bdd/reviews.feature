@reviews
Feature: Review Management
  As a patient
  I want to submit reviews for completed appointments and view reviews
  So that doctors receive feedback and patients can see consultation ratings

  Background:
    Given the system has a doctor "Dr. Sarah Chen" with specialization "Cardiology"
    And the system has a patient "Anna de Vries"
    And the doctor has a completed appointment with the patient

  # UC-10: Submit Review (BR-REV-01..05)
  @uc-10 @medium
  Scenario: Patient submits a review with a rating and comment
    Given the patient is authenticated
    And the patient has a completed appointment without a review
    When the patient selects the completed appointment
    And the patient selects a rating of 5
    And the patient enters a comment "Very professional"
    And the patient submits the review
    Then a review is created for the appointment
    And the doctor's average rating is recalculated
    And the system displays a confirmation

  @uc-10 @medium
  Scenario: Patient submits a review with only a rating
    Given the patient is authenticated
    And the patient has a completed appointment without a review
    When the patient selects the completed appointment
    And the patient selects a rating of 4
    And the patient submits the review without a comment
    Then a review is created for the appointment
    And the doctor's average rating is recalculated

  @uc-10 @medium
  Scenario: Cannot review an appointment that is not completed
    Given the patient is authenticated
    And the patient has an appointment with status "CONFIRMED"
    When the patient attempts to submit a review for the appointment
    Then the system displays an error
    And no review is created

  @uc-10 @medium
  Scenario: Cannot review an appointment twice
    Given the patient is authenticated
    And the patient has a completed appointment with an existing review
    When the patient attempts to submit another review for the appointment
    Then the system displays the error "You have already reviewed this appointment"

  @uc-10 @medium
  Scenario: Patient cannot review an appointment they do not own
    Given the patient is authenticated
    And another patient has a completed appointment without a review
    When the patient attempts to submit a review for the other patient's appointment
    Then the system rejects the action
    And the system displays an authorization error

  # Rating boundary coverage (BVA: 0 and 6 invalid, 1..5 valid)
  @uc-10 @medium @boundary-value-analysis
  Scenario Outline: Rating boundaries are validated
    Given the patient is authenticated
    And the patient has a completed appointment without a review
    When the patient submits a review with rating <rating>
    Then the review is <result>

    Examples:
      | rating | result  |
      | 0      | rejected |
      | 1      | accepted |
      | 2      | accepted |
      | 4      | accepted |
      | 5      | accepted |
      | 6      | rejected |

  # UC-11: View Reviews
  @uc-11 @low
  Scenario: Patient views reviews they have written
    Given the patient is authenticated
    And the patient has written 2 reviews
    And another patient has written 1 review
    When the patient navigates to the reviews view
    Then the system displays only the 2 reviews written by the patient

  @uc-11 @low
  Scenario: Doctor views reviews received for their consultations
    Given the doctor is authenticated
    And the doctor has received 3 reviews
    And another doctor has received 2 reviews
    When the doctor navigates to the reviews view
    Then the system displays only the 3 reviews received by the doctor

  @uc-11 @low
  Scenario: Review statistics are displayed
    Given the doctor is authenticated
    And the doctor has received reviews with ratings 5, 4, and 3
    When the doctor navigates to the reviews view
    Then the system displays the average rating of 4
    And the system displays the total review count of 3

  @uc-11 @low
  Scenario: Doctor cannot modify or delete reviews
    Given the doctor is authenticated
    And the doctor has received a review
    When the doctor attempts to modify or delete the review
    Then the system rejects the action
    And the system displays an authorization error