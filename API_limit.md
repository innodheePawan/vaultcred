Configurable API Throttling

Do not hardcode API rate limits.

Add configurable throttling settings under:

/settings/security

in the same section where:

Global API Enable/Disable
API Security Policies

are managed.

Visibility & Access Control

This section must be visible and manageable only by:

Super Admin

Scoped Admins or other users must not have access to:

API throttling configuration
API abuse/security policies
IP blocking configuration
Dependency Rule
API Limit Policies

must only be enabled when:

Global API Access = Enabled

If Global API Access is disabled:

throttling configuration should remain disabled/read-only
external APIs remain inaccessible
existing API disabled behavior continues as-is
Configurable APIs

Allow configurable throttling for:

/api/v1/auth/token
/api/v1/credentials
/api/v1/credentials/{CredentialID}/reveal
/api/v1/credentials/{CredentialID}/files/{FileName}
Recommended Default Values
API	Default Limit
/api/v1/auth/token	10 req / min
/api/v1/credentials	50 req / min
/api/v1/credentials/{id}/reveal	200 req / min
/api/v1/credentials/{id}/files/{fileName}	30 req / min

These values are defaults only and must remain configurable by Super Admins.

Abuse Protection Integration

Reuse the existing login IP blocking/security mechanism for API abuse handling.

Existing escalation model:

IP: ≥20 failures in 30min → Block for 4 hours
2nd block in 24h → Block for 24 hours
5 total blocks → PERMANENT BAN

The same behavior should apply for repeated API abuse/throttling violations.