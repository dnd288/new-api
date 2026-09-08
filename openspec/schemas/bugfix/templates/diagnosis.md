# Diagnosis: <defect-name>

## Root Cause

Every claim carries the observation (log line, test output, stack trace) that proves it.

## Code Path

Trace from entry point to the failure.

```
entry → function → function → failure
```

## Database Backends

Which backends reproduce the defect:
- [ ] SQLite
- [ ] MySQL
- [ ] PostgreSQL

## Impact Analysis

What else relies on the code being changed? Search callers, check shared paths.
