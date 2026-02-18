Overview

Link: https://civicfix-frontend02.onrender.com

CivicFix is a backend-focused civic issue management platform designed to model how real-world public infrastructure issues are reported, tracked, and resolved with transparency and accountability.
The system emphasizes controlled workflows, role-based authority, and auditability rather than simple CRUD operations.

Problem Statement

Public issue reporting systems often fail due to:
Lack of accountability in issue handling
Unclear ownership and decision authority
Risk of unauthorized or inconsistent status changes

CivicFix addresses these challenges by enforcing strict backend validation rules and maintaining complete action traceability.

System Design Highlights

State-Machine–Driven Issue Lifecycle
Issues transition through strictly validated states
(Reported → Verified → Assigned → In Progress → Resolved → Closed),
preventing invalid or unauthorized state changes.
Role-Based & Context-Aware Authorization
Citizens, Officers, Supervisors, and Admins operate under asymmetric permissions enforced at the API layer.
Audit-First Architecture
All critical actions generate immutable audit records using append-only logs to support traceability and accountability.

Core Workflow
Citizen reports an issue with category, location, and supporting evidence
Supervisor verifies and assigns the issue to an officer
Officer progresses the issue through validated workflow states
Supervisor reviews and approves resolution
Complete action history is preserved via structured audit logging

Backend-Focused Architecture
RESTful APIs with fine-grained authorization checks
Centralized workflow validation logic
MongoDB schemas designed for structured historical tracking

Server-side enforcement of business rules

Design Decisions
Workflow transitions are validated centrally, not per endpoint
Business rules are enforced server-side
No hard deletes — historical integrity is preserved
Authorization boundaries are role-driven and context-aware

Tech Stack
Backend: Node.js, Express.js
Frontend: React.js
Database: MongoDB, Mongoose
Auth: JWT, Role-Based Access Control (RBAC)
Tools: Git/GitHub, Postman
