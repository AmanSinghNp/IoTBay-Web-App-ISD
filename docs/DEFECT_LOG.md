# IoTBay Web Application - Defect Log

## Project Information

- **Project**: IoTBay Web Application - ISD Assignment 2
- **Testing Period**: January 2024 - May 2024
- **Tester**: Development Team
- **Version**: 1.0.0

---

## Defect Summary

| **Metric**          | **Count** | **Percentage** |
| ------------------- | --------- | -------------- |
| Total Defects       | 8         | 100%           |
| Resolved Defects    | 6         | 75%            |
| In Progress Defects | 1         | 12.5%          |
| Unresolved Defects  | 1         | 12.5%          |

---

## Defect Details

### DI001 - Database Architecture Inconsistency

| **Field**              | **Value**                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI001                                                                                                                                               |
| **Defect Description** | Payment model uses direct SQLite queries while other models use Sequelize ORM, creating architectural inconsistency                                 |
| **Defect Date**        | 2024-01-20                                                                                                                                          |
| **Test Case ID**       | TC_PAYMENT_001                                                                                                                                      |
| **Tester Name**        | Development Team                                                                                                                                    |
| **Responsible**        | Backend Developer                                                                                                                                   |
| **Status**             | Resolved                                                                                                                                            |
| **Priority**           | High                                                                                                                                                |
| **Severity**           | Major                                                                                                                                               |
| **Comments**           | Created new Sequelize-based Payment model (paymentSequelize.js) to maintain consistency. Updated app.js to use new model with proper relationships. |

### DI002 - Missing JUnit Test Framework

| **Field**              | **Value**                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI002                                                                                                                                                           |
| **Defect Description** | Assignment requires JUnit tests but project only had custom Node.js test scripts                                                                                |
| **Defect Date**        | 2024-01-22                                                                                                                                                      |
| **Test Case ID**       | TC_TESTING_001                                                                                                                                                  |
| **Tester Name**        | QA Team                                                                                                                                                         |
| **Responsible**        | Test Engineer                                                                                                                                                   |
| **Status**             | Resolved                                                                                                                                                        |
| **Priority**           | High                                                                                                                                                            |
| **Severity**           | Major                                                                                                                                                           |
| **Comments**           | Implemented Jest testing framework with proper unit tests for User Access Management and Payment Management features. Added test configuration and setup files. |

### DI003 - User Access Log Cascade Delete Issue

| **Field**              | **Value**                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI003                                                                                                     |
| **Defect Description** | When user is deleted, access logs remain in database causing orphaned records                             |
| **Defect Date**        | 2024-01-25                                                                                                |
| **Test Case ID**       | TC_USER_DELETE_001                                                                                        |
| **Tester Name**        | Backend Developer                                                                                         |
| **Responsible**        | Database Administrator                                                                                    |
| **Status**             | Resolved                                                                                                  |
| **Priority**           | Medium                                                                                                    |
| **Severity**           | Minor                                                                                                     |
| **Comments**           | Added proper foreign key constraints and cascade delete in UserAccessLog model. Verified with unit tests. |

### DI004 - Payment Validation Missing

| **Field**              | **Value**                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Defect ID**          | DI004                                                                                                                          |
| **Defect Description** | Payment amount can be negative, no validation for positive amounts                                                             |
| **Defect Date**        | 2024-02-01                                                                                                                     |
| **Test Case ID**       | TC_PAYMENT_VALIDATION_001                                                                                                      |
| **Tester Name**        | Frontend Developer                                                                                                             |
| **Responsible**        | Backend Developer                                                                                                              |
| **Status**             | In Progress                                                                                                                    |
| **Priority**           | Medium                                                                                                                         |
| **Severity**           | Minor                                                                                                                          |
| **Comments**           | Need to add custom validation in Payment model to ensure amount is positive. Currently documented in test but not implemented. |

### DI005 - Session Timeout Not Configured

| **Field**              | **Value**                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI005                                                                                         |
| **Defect Description** | User sessions don't expire properly, potential security issue                                 |
| **Defect Date**        | 2024-02-05                                                                                    |
| **Test Case ID**       | TC_SESSION_001                                                                                |
| **Tester Name**        | Security Tester                                                                               |
| **Responsible**        | Backend Developer                                                                             |
| **Status**             | Resolved                                                                                      |
| **Priority**           | Medium                                                                                        |
| **Severity**           | Minor                                                                                         |
| **Comments**           | Added session timeout configuration in app.js (24 hours). Implemented proper session cleanup. |

### DI006 - Device Stock Validation Error

| **Field**              | **Value**                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI006                                                                                                                                                   |
| **Defect Description** | Users can order devices with 0 stock, causing negative inventory                                                                                        |
| **Defect Date**        | 2024-02-10                                                                                                                                              |
| **Test Case ID**       | TC_ORDER_STOCK_001                                                                                                                                      |
| **Tester Name**        | Business Analyst                                                                                                                                        |
| **Responsible**        | Backend Developer                                                                                                                                       |
| **Status**             | Resolved                                                                                                                                                |
| **Priority**           | High                                                                                                                                                    |
| **Severity**           | Major                                                                                                                                                   |
| **Comments**           | Added stock validation in order controller. Prevents orders when stock is 0 or insufficient. Updated UI to disable order button for out-of-stock items. |

### DI007 - Flash Message Persistence Issue

| **Field**              | **Value**                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI007                                                                                                                   |
| **Defect Description** | Flash messages sometimes persist across multiple page loads                                                             |
| **Defect Date**        | 2024-02-15                                                                                                              |
| **Test Case ID**       | TC_UI_FLASH_001                                                                                                         |
| **Tester Name**        | Frontend Developer                                                                                                      |
| **Responsible**        | Frontend Developer                                                                                                      |
| **Status**             | Resolved                                                                                                                |
| **Priority**           | Low                                                                                                                     |
| **Severity**           | Minor                                                                                                                   |
| **Comments**           | Fixed flash message middleware in app.js to properly clear messages after display. Added proper session flash handling. |

### DI008 - Missing Error Handling in Payment Controller

| **Field**              | **Value**                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Defect ID**          | DI008                                                                                                                                    |
| **Defect Description** | Payment controller doesn't handle database connection errors gracefully                                                                  |
| **Defect Date**        | 2024-02-20                                                                                                                               |
| **Test Case ID**       | TC_ERROR_HANDLING_001                                                                                                                    |
| **Tester Name**        | Backend Developer                                                                                                                        |
| **Responsible**        | Backend Developer                                                                                                                        |
| **Status**             | Unresolved                                                                                                                               |
| **Priority**           | Medium                                                                                                                                   |
| **Severity**           | Minor                                                                                                                                    |
| **Comments**           | Need to add comprehensive try-catch blocks and proper error responses in payment controller. Currently only basic error handling exists. |

---

## Test Case References

### TC_PAYMENT_001 - Payment Model Architecture Test

- **Description**: Verify payment model follows same architecture as other models
- **Expected Result**: Payment model uses Sequelize ORM with proper relationships
- **Actual Result**: Payment model used direct SQLite queries
- **Status**: Failed → Passed (after fix)

### TC_TESTING_001 - Test Framework Compliance

- **Description**: Verify project uses JUnit-style testing as required by assignment
- **Expected Result**: Jest or similar framework with proper unit tests
- **Actual Result**: Only custom Node.js test scripts
- **Status**: Failed → Passed (after implementation)

### TC_USER_DELETE_001 - User Deletion Cascade Test

- **Description**: Verify user deletion properly removes associated access logs
- **Expected Result**: Access logs deleted when user is deleted
- **Actual Result**: Orphaned access log records remained
- **Status**: Failed → Passed (after fix)

### TC_PAYMENT_VALIDATION_001 - Payment Amount Validation

- **Description**: Verify payment amount must be positive
- **Expected Result**: Negative amounts rejected with validation error
- **Actual Result**: Negative amounts accepted
- **Status**: Failed → In Progress

### TC_SESSION_001 - Session Management Test

- **Description**: Verify user sessions expire after configured timeout
- **Expected Result**: Session expires after 24 hours
- **Actual Result**: Sessions persisted indefinitely
- **Status**: Failed → Passed (after fix)

### TC_ORDER_STOCK_001 - Stock Validation Test

- **Description**: Verify orders cannot be placed for out-of-stock items
- **Expected Result**: Order rejected when stock is 0
- **Actual Result**: Order accepted, causing negative stock
- **Status**: Failed → Passed (after fix)

### TC_UI_FLASH_001 - Flash Message Display Test

- **Description**: Verify flash messages display once and then clear
- **Expected Result**: Message shows once then disappears
- **Actual Result**: Messages persisted across page loads
- **Status**: Failed → Passed (after fix)

### TC_ERROR_HANDLING_001 - Error Handling Test

- **Description**: Verify graceful error handling in payment operations
- **Expected Result**: Proper error responses and user feedback
- **Actual Result**: Some errors not handled gracefully
- **Status**: Failed → Open

---

## Defect Trends

### By Priority

- **High**: 2 defects (25%)
- **Medium**: 4 defects (50%)
- **Low**: 2 defects (25%)

### By Severity

- **Major**: 3 defects (37.5%)
- **Minor**: 5 defects (62.5%)

### By Status

- **Resolved**: 6 defects (75%)
- **In Progress**: 1 defect (12.5%)
- **Unresolved**: 1 defect (12.5%)

---

## Recommendations

1. **Complete Payment Validation**: Implement positive amount validation in Payment model
2. **Enhance Error Handling**: Add comprehensive error handling in all controllers
3. **Automated Testing**: Expand test coverage to include integration tests
4. **Code Review Process**: Implement peer review to catch architectural inconsistencies early
5. **Documentation**: Maintain updated API documentation for all endpoints

---

## Sign-off

| **Role**              | **Name**         | **Date**   | **Signature**       |
| --------------------- | ---------------- | ---------- | ------------------- |
| **Test Lead**         | Development Team | 2024-05-25 | [Digital Signature] |
| **Project Manager**   | Development Team | 2024-05-25 | [Digital Signature] |
| **Quality Assurance** | Development Team | 2024-05-25 | [Digital Signature] |
