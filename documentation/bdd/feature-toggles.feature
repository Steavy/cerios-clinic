@feature-toggles
Feature: Feature Toggle Management
  As an admin
  I want to enable or disable feature toggles at runtime
  So that features can be rolled out gradually and bug simulations can be controlled

  Background:
    Given the admin is authenticated

  # UC-19: Manage Feature Toggles
  @uc-19 @low
  Scenario: Admin views all feature toggles with their current state
    Given the system has 5 feature toggles
    When the admin navigates to the feature toggles page
    Then the system displays all 5 feature toggles with their current state

  @uc-19 @low
  Scenario: Admin enables a feature toggle
    Given the feature toggle "bug:same-day-restriction" is disabled
    When the admin toggles "bug:same-day-restriction" on
    Then the feature toggle state is saved as enabled
    And the toggle is applied immediately without a restart

  @uc-19 @low
  Scenario: Admin disables a feature toggle
    Given the feature toggle "bug:api-slowdown" is enabled
    When the admin toggles "bug:api-slowdown" off
    Then the feature toggle state is saved as disabled
    And the toggle is applied immediately without a restart

  @uc-19 @low
  Scenario: Admin modifies a feature toggle configuration
    Given the feature toggle "bug:api-slowdown" is enabled
    When the admin modifies the configuration to '{"minDelayMs": 1000, "maxDelayMs": 5000}'
    And the admin saves the changes
    Then the feature toggle configuration is updated
    And the new configuration is applied immediately

  @uc-19 @low
  Scenario: Enabled toggle changes API behavior
    Given the feature toggle "bug:same-day-restriction" is enabled
    When a patient attempts to book a same-day appointment
    Then the system restricts the same-day booking

  @uc-19 @low
  Scenario: Disabled toggle does not change API behavior
    Given the feature toggle "bug:same-day-restriction" is disabled
    When a patient attempts to book a same-day appointment
    Then the system allows the same-day booking

  @uc-19 @low
  Scenario: Non-admin cannot manage feature toggles
    Given the doctor is authenticated
    When the doctor attempts to access the feature toggles page
    Then the system rejects the action
    And the system displays an authorization error