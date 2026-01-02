# Data Retention Schedule

| Category                | Tables                       | Default retention                        | Lawful basis                      | Notes                                        |
|-------------------------|-----------------------------|------------------------------------------|-----------------------------------|----------------------------------------------|
| Marketing leads         | marketing_leads             | 2 years from last interaction           | Legitimate interest               | Delete or anonymise after period             |
| User & firm accounts    | profiles, firms, auth.users | Subscription term + 1 year              | Contract                          | May extend for disputes / chargebacks        |
| Client & matter records | clients, matters            | 6 years after matter closure (default)  | Legal obligation (law firm duty) | Per‑firm configurable in app                 |
| AML / KYC & audit logs  | aml_checks, audit_events    | 7 years from event/record creation      | Legal obligation / accountability | Needed for AML and professional rules        |
| Backups                 | DB backups                  | ~90 days rolling                         | Security / continuity             | No per‑record deletion; overwritten in cycle |
