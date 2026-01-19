# Incident Response Plan (LawIntake)

## 1. Scope and definitions

This plan applies to any **security incident** that may involve **personal data** processed through LawIntake, including data we host in Supabase and any data handled by our sub‑processors (Stripe, Mailgun, Vercel, etc.).

A **personal data breach** is a security incident that leads to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data (GDPR, Article 4(12)).[web:249]

We treat all suspected incidents as potential personal data breaches until assessed.

---

## 2. Roles and contacts

- **Incident Lead / Founder:** [Your Name], [email], [phone]
- **Privacy contact:** privacy@lawintake.io
- **Technical contact:** security@lawintake.io (or same as above)

If and when a formal Data Protection Officer (DPO) is appointed, their contact details will be added here and in the Privacy Policy.

---

## 3. Detection and initial response (Hour 0–4)

**Triggers** (examples):

- Sentry alerts for unusual error spikes indicating possible data access issues.[web:240][web:244]
- Uptime monitor or health check failures suggesting compromise or tampering.[web:245][web:254]
- Reports from customers (law firms) about suspicious activity.
- Internal observations (e.g. unexpected Supabase access logs).

**Immediate actions (as soon as a potential breach is suspected):**[web:246][web:249]

1. **Log the incident**  
   - Record date/time, who reported it, and a short description in an internal incident log.

2. **Contain and preserve**  
   - Revoke or rotate any potentially compromised API keys, tokens or passwords.  
   - Temporarily disable affected functionality if necessary (e.g. API route, admin panel).  
   - Preserve relevant logs and evidence (Supabase logs, Vercel logs, Sentry events, screenshots).

3. **Assemble response team**  
   - Technical and privacy contact review the incident and start the preliminary assessment.

We aim to complete these steps within **the first 4 hours** of becoming aware of a suspected breach.

---

## 4. Assessment (Hour 4–24)

Objective: decide whether this is a **personal data breach** under GDPR and whether it is **notifiable**.

Key questions:[web:246][web:249]

- What happened and for how long?  
- Which systems and data were affected (tables, records, fields)?  
- What categories of personal data are involved (e.g. client details, AML flags, audit logs)?  
- Approximately how many data subjects and firms are affected?  
- What is the likely impact on individuals (e.g. identity risk, professional confidentiality, AML sensitivity)?  
- Is the data encrypted or otherwise protected in a way that significantly lowers the risk?

Outcomes:

- **Not a personal data breach / no risk** → record decision and close with justification.  
- **Personal data breach, low risk** → may not require notification but must still be documented.  
- **Personal data breach, likely high risk to individuals** → will require notification to the supervisory authority and, where appropriate, to affected data subjects.[web:249]

We aim to complete this initial assessment within **24 hours** of becoming aware of the incident.

---

## 5. Notification (Hour 24–72)

If notification is required:

### 5.1 Supervisory authority

Where the incident is likely to result in a risk to the rights and freedoms of natural persons, we will notify the competent supervisory authority **without undue delay and, where feasible, within 72 hours** of becoming aware of the breach, in line with GDPR Article 33.[web:249][web:246]

The notification will include, as far as possible:

- A description of the nature of the personal data breach (including categories and approximate number of data subjects and records affected).  
- The name and contact details of the privacy contact or DPO.  
- A description of the likely consequences of the breach.  
- A description of the measures taken or proposed to address the breach and mitigate its possible adverse effects.[web:249]

If notification is made after 72 hours, we will include reasons for the delay.

### 5.2 Customer (Controller) notification

Because we act as **processor** for client/matter data, we will notify affected customer law firms **without undue delay** after becoming aware of a relevant personal data breach affecting their data, providing sufficient information to enable them to meet their own obligations under GDPR.[web:249]

This includes:

- A description of the incident and affected data.  
- When it occurred and when we became aware of it.  
- What we have done and plan to do to contain and remediate it.  
- Any steps we recommend they take.

The customer (Controller) is responsible for deciding whether to notify data subjects and/or supervisory authorities, except where we are directly subject to such an obligation.

---

## 6. Communication with affected individuals (if required)

Where the breach is likely to result in a **high risk** to individuals, we will support our customer law firms in preparing clear, plain‑language communications to affected individuals, describing:[web:249][web:246]

- What happened and when.  
- What data was involved.  
- The potential consequences.  
- What has been done so far.  
- What individuals can do to protect themselves.  
- How to contact the firm and/or LawIntake for more information.

We will provide templates and technical details as needed but the firm, as Controller, retains responsibility for content and timing.

---

## 7. Remediation and lessons learned

After containment and notification:

1. **Fix root cause**  
   - Patch vulnerabilities, change configuration (e.g. RLS policy, API key scopes), update code.

2. **Review controls**  
   - Evaluate whether existing monitoring, access controls, and safeguards were adequate.  
   - Identify changes to reduce the likelihood or impact of similar incidents (e.g. additional logging, rate limits, stricter roles).

3. **Update documentation**  
   - Update the incident log with a full record of the event, decisions, notifications and remediation.  
   - Adjust internal procedures, runbooks and security documentation as needed.

4. **Customer follow‑up**  
   - Provide a brief summary to affected customers, outlining what happened, what has changed, and any remaining actions.

---

## 8. Record‑keeping

For every suspected or confirmed incident, we will keep:[web:246][web:249]

- Date/time of detection and awareness.  
- Description of the incident and its cause (where known).  
- Assessment of whether it constituted a personal data breach.  
- Rationale for notification (or non‑notification) to supervisory authority and customers.  
- Copies of notifications and communications.  
- Details of containment, remediation and improvements.

These records will be stored securely and retained in line with our audit log / incident‑record retention periods (typically 7 years).

