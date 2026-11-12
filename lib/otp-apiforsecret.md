# CredSecure – External API for One-Time Secret Creation
## Final Consolidated Requirements

### 1. API Definition

**Method:** POST  
**Endpoint:** `/api/v1/one-time-secrets`

The API will create a One-Time Secret using CredSecure's existing functionality and return the generated password to the calling application.

### 2. Request Payload

```json
{
  "userName": "John Smith",
  "email": "john.smith@example.com",
  "referenceId": "ONBOARD-2026-001"
}
```

| Field | Mandatory | Description |
|---|---|---|
| userName | Yes | Recipient's name |
| email | Yes | Recipient's email address |
| referenceId | No | External reference for future tracking, validation, and duplicate prevention |

### 3. Password Generation

- Reuse the existing CredSecure password generator utility.
- Generate a password of **exactly 16 characters**.
- Follow the existing password complexity rules.
- Generate the password only once per successful creation request.
- The generated password must be identical in the OTS and API response.

### 4. OTS Configuration

| Property | Value |
|---|---|
| Password length | 16 characters |
| Validity | 7 days |
| Maximum successful views | 5 |
| Email notification | Existing OTS email process |
| Storage | Existing encrypted OTS mechanism |
| Authentication | Existing External API process |
| Authorization | Existing External API process |
| Audit | Existing audit framework |

### 5. API Response

**HTTP 201 – Created**

```json
{
  "success": true,
  "otsId": "OTS-123456",
  "referenceId": "ONBOARD-2026-001",
  "userName": "John Smith",
  "email": "john.smith@example.com",
  "generatedPassword": "K9@mP4#xT7$qL2z",
  "status": "CREATED",
  "emailStatus": "SENT",
  "expiresAt": "2026-11-12T11:10:00Z",
  "maxViews": 5
}
```

The `generatedPassword` must only be returned in the initial successful creation response.

### 6. Reference ID Handling

- The `referenceId` is optional.
- Store it with the OTS record.
- Include it in the API response and relevant audit metadata.
- Associate it with the authenticated API client to avoid collisions between applications.
- If the same client submits an existing `referenceId`, do not generate another password or OTS automatically.
- Return a duplicate-reference response without exposing the previously generated password.
- Requests without a `referenceId` follow the normal creation process.

A duplicate reference may return **HTTP 409 – Conflict**, including the existing OTS identifier and reference ID but no password.

### 7. Email Delivery

Reuse the existing OTS email notification process without modification.

The email must contain the existing secure OTS access link, not the generated password.

### 8. Authentication and Authorization

**No changes are permitted to the existing External API authentication or authorization implementation.**

The new endpoint must integrate with the existing mechanism.

### 9. Security and Audit

- Return the generated password only in the initial successful API response.
- Do not log or audit plaintext passwords.
- Use HTTPS and prevent response caching.
- Reuse existing encryption, expiry, view tracking, and access controls.
- Record the API client, recipient, reference ID, OTS identifier, creation timestamp, and delivery status.
- Ensure the OTS appears on `/one-time-secrets` with the same behavior as manually created OTS records.

### 10. Acceptance Criteria

1. API accepts username, email, and optional reference ID.
2. Password is generated with exactly 16 characters.
3. Existing OTS process is reused.
4. OTS expires after 7 days or 5 successful views, whichever occurs first.
5. Existing OTS email notification is triggered.
6. Initial API response includes the generated password.
7. Reference ID is stored and returned.
8. Duplicate reference IDs are handled without generating another password.
9. Authentication and authorization remain unchanged.
10. Existing manual OTS functionality continues working without regression.
