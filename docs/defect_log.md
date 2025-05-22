# Defect Log

## Team Information

- Tutorial: Workshop 2, Friday 10:00-13:00
- Tutor: Md Sarwar Kamal

## Latest Test Run (2024-03-23)

- All test suites passing (4/4)
- All tests passing (29/29)
- No new defects identified

## Defect Status Indicators

- 🔴 Critical
- 🟡 Major
- 🟢 Minor
- ✅ Resolved
- ⏳ In Progress
- ❌ Open

## Feature 01: Online User Access Management

**Owner**: Aman Singh (25104201)

| Defect ID | Severity | Description                         | Test Case ID | Date       | Status | Resolution                         |
| --------- | -------- | ----------------------------------- | ------------ | ---------- | ------ | ---------------------------------- |
| UAM-D01   | 🟡       | Session not invalidated on logout   | UAM-03       | 2024-03-20 | ✅     | Implemented proper session cleanup |
| UAM-D02   | 🟢       | Access log missing IP address       | UAM-04       | 2024-03-21 | ✅     | Added IP address logging           |
| UAM-D03   | 🟢       | Password strength indicator missing | UAM-05       | 2024-03-22 | ✅     | Added password strength meter      |

## Feature 02: IoT Device Catalogue Management

**Owner**: Xiao Luo (24671707)

| Defect ID | Severity | Description                            | Test Case ID | Date       | Status | Resolution                     |
| --------- | -------- | -------------------------------------- | ------------ | ---------- | ------ | ------------------------------ |
| DCM-D01   | 🔴       | Stock count not updating after order   | DCM-01       | 2024-03-20 | ✅     | Fixed transaction handling     |
| DCM-D02   | 🟢       | Search not handling special characters | DCM-04       | 2024-03-21 | ✅     | Improved search sanitization   |
| DCM-D03   | 🟢       | Image loading slow for large catalogs  | DCM-05       | 2024-03-22 | ✅     | Implemented image optimization |

## Feature 03: Order Management

**Owner**: Vinix Collen (25115294)

| Defect ID | Severity | Description                         | Test Case ID | Date       | Status | Resolution                |
| --------- | -------- | ----------------------------------- | ------------ | ---------- | ------ | ------------------------- |
| ORD-D01   | 🔴       | Order total calculation incorrect   | ORD-01       | 2024-03-20 | ✅     | Fixed calculation logic   |
| ORD-D02   | 🟡       | Cancel order not refunding payment  | ORD-03       | 2024-03-21 | ✅     | Integrated refund process |
| ORD-D03   | 🟢       | Order history not sorting correctly | ORD-02       | 2024-03-22 | ✅     | Implemented sort fix      |

## Feature 04: Payment Management

**Owner**: Liana Ayoub (25253612)

| Defect ID | Severity | Description                       | Test Case ID | Date       | Status | Resolution             |
| --------- | -------- | --------------------------------- | ------------ | ---------- | ------ | ---------------------- |
| PAY-D01   | 🔴       | Double payment possible           | PAY-01       | 2024-03-20 | ✅     | Added transaction lock |
| PAY-D02   | 🟡       | Refund not updating order status  | PAY-03       | 2024-03-21 | ✅     | Fixed status sync      |
| PAY-D03   | 🟢       | Payment history pagination broken | PAY-02       | 2024-03-22 | ✅     | Fixed pagination       |

## Feature 05: Shipment Management

**Owner**: Tuyet Anh Nguyen (24625788)

| Defect ID | Severity | Description                         | Test Case ID | Date       | Status | Resolution                |
| --------- | -------- | ----------------------------------- | ------------ | ---------- | ------ | ------------------------- |
| SHP-D01   | 🟡       | Address validation incomplete       | SHP-04       | 2024-03-20 | ✅     | Enhanced validation rules |
| SHP-D02   | 🟢       | Tracking updates not real-time      | SHP-02       | 2024-03-21 | ✅     | Implemented webhooks      |
| SHP-D03   | 🟢       | Delivery date calculation incorrect | SHP-05       | 2024-03-22 | ✅     | Fixed date logic          |

## Feature 06: User Management

**Owner**: Hyun Woo Cho (13562107)

| Defect ID | Severity | Description                          | Test Case ID | Date       | Status | Resolution             |
| --------- | -------- | ------------------------------------ | ------------ | ---------- | ------ | ---------------------- |
| USR-D01   | 🔴       | Role change not updating permissions | USR-04       | 2024-03-20 | ✅     | Fixed permission sync  |
| USR-D02   | 🟡       | User search not filtering correctly  | USR-05       | 2024-03-21 | ✅     | Improved search logic  |
| USR-D03   | 🟢       | Profile update not validating email  | USR-02       | 2024-03-22 | ✅     | Added email validation |

## Overall Summary

### By Status

- ✅ Resolved: 18 (100%)
- ⏳ In Progress: 0 (0%)
- ❌ Open: 0 (0%)

### By Severity

- 🔴 Critical: 4 (22.2%)
- 🟡 Major: 5 (27.8%)
- 🟢 Minor: 9 (50%)

### By Feature

1. User Access Management: 3 defects (all resolved)
2. Device Catalogue: 3 defects (all resolved)
3. Order Management: 3 defects (all resolved)
4. Payment Management: 3 defects (all resolved)
5. Shipment Management: 3 defects (all resolved)
6. User Management: 3 defects (all resolved)

## Latest Test Run Notes

- All previously identified defects have been resolved
- No new defects found in latest test run
- All features passing unit and integration tests
- Performance metrics within acceptable ranges
- Security measures functioning as expected

## Notes

- All critical defects have been resolved
- Most remaining issues are minor and being actively worked on
- No new defects reported in the last 24 hours
- Testing coverage has been comprehensive across all features
