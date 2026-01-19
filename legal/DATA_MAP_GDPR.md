---

## 11. Security Incidents & Breach Response

### 11.1 Scope

This section covers how LawIntake responds to any actual or suspected security incident involving personal data processed by the app (including data stored in Supabase and handled by sub‑processors such as Stripe, Mailgun and Vercel).[web:249]

A **personal data breach** is understood as defined in GDPR Article 4(12): a security breach leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data.[web:249]

### 11.2 Monitoring and detection

To detect incidents quickly, LawIntake uses:

- **Error monitoring:** Sentry for application‑level errors in both client and server code.[web:240][web:241]
- **Uptime/health monitoring:** External health checks (e.g. Checkly or equivalent) that regularly call the public site and a `/api/health` endpoint.[web:245][web:254]
- **Platform logs:** Supabase and Vercel logs for access anomalies and operational events.[web:251][web:205]

Alerts from these tools, as well as customer reports and internal observations, are treated as potential incidents until assessed.

### 11.3 Incident response plan

LawIntake maintains a separate **Incident Response Plan** document (`INCIDENT_RESPONSE.md`) that defines:

- Roles and contacts (incident lead, privacy contact).  
- Step‑by‑step actions for detection, containment and assessment (0–24 hours).  
- Criteria for when an incident is a notifiable personal data breach under GDPR.  
- Timelines and content for notifications to supervisory authorities and customer law firms (aiming to meet the 72‑hour rule where notification is required).[web:246][web:249][web:252]
- Support for customer communications to affected individuals, where appropriate.  
- Remediation, lessons‑learned steps and record‑keeping requirements (typically 7‑year retention for incident records, aligned with audit logs).

The Incident Response Plan is reviewed periodically and after any significant incident, and is kept in sync with this data map and our Privacy Policy / DPA.

### 11.4 Relationship to controllers (law firms)

For client and matter data, LawIntake acts as **processor** and will:

- Notify affected customer law firms without undue delay after becoming aware of a personal data breach affecting their data.  
- Provide sufficient technical detail and support for controllers to meet their own notification obligations under GDPR Articles 33 and 34, while controllers remain responsible for deciding whether and how to notify data subjects and authorities.[web:249]

For data where LawIntake is controller (e.g. marketing leads, its own user accounts), LawIntake follows the same incident response plan and breach‑notification logic, including its own obligations to notify the relevant supervisory authority where required.

