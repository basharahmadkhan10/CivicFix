### Overview
Link: https://civicfix-frontend02.onrender.com
CivicFix is a backend-focused civic issue management platform designed to model how real-world public infrastructure issues are reported, tracked, and resolved with transparency and accountability.
The system emphasizes **controlled workflows, role-based authority, SLA enforcement, and auditability** rather than simple CRUD operations.

---

### Problem Statement

Public issue reporting systems often fail due to lack of:

* Accountability in issue handling
* Clear ownership and escalation
* Protection against misuse or silent overrides

CivicFix is designed to address these gaps by enforcing backend-level rules and traceability.

---

### System Design Highlights

* State-Machine–Driven Issue Lifecycle
  Issues transition through strictly validated states (Reported → Verified → Assigned → In Progress → Resolved → Closed), preventing invalid or unauthorized actions.

* Role-Based & Context-Aware Authorization
  Citizens, officers, supervisors, auditors, and admins have asymmetric permissions enforced at the API level.

* SLA Monitoring & Escalation
  Issues carry SLA deadlines based on category and priority, monitored by background workers with automatic escalation on breaches.

* Audit-First Architecture
  All critical actions generate immutable audit records using append-only logs and document versioning to support traceability and tamper detection.
  
---

### Core Workflow

1. Citizen reports an issue with category, location, and evidence
2. Issue is verified and assigned to the appropriate department
3. Officer progresses the issue under SLA constraints
4. Supervisor reviews and approves resolution
5. Audit logs preserve the complete history of actions

---

### Backend-Focused Architecture

* RESTful APIs with fine-grained authorization checks
* Async job queues for SLA tracking, escalation, and notifications
* Background workers for monitoring long-running workflows
* MongoDB schemas optimized for versioning and historical integrity

---

### Design Decisions (Interview-Relevant)

* Business rules are enforced **server-side**, not in the UI
* No hard deletes — historical correctness is preserved
* Audit and workflow logic is treated as first-class system behavior
* UI is intentionally kept minimal to prioritize backend correctness

---

###  Tech Stack

* Backend: Node.js, Express.js
* Database: MongoDB, Mongoose
* Auth: JWT, Role-Based Access Control (RBAC)
* Async Processing: Job Queues, Background Workers
* Tools: Git/GitHub, Postman

---

### Status

This project is actively under development with a focus on backend reliability, workflow correctness, and interview-grade system design.

---

### Why This Project

CivicFix is built to demonstrate **real-world backend engineering patterns** such as state machines, authorization boundaries, SLA handling, and auditability — concepts commonly used in internal and government-grade systems.
