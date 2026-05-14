User Lifecycle Management – Active / Inactive Model with RBAC
Objective

To avoid foreign key constraint issues during user deletion, preserve audit history, and support future reactivation, the system will replace Delete User with an Active / Inactive lifecycle model.

Users will no longer be deleted from the database.
Instead, access will be revoked while keeping the user record for audit and ownership tracking.

This ensures references like created_by, updated_by, performed_by, approvals, and ownership remain permanently linked to the original user.

User Status Model

Only two statuses:
    ACTIVE
    INACTIVE

Inactive users can be reactivated when required.

Remove Delete User

Remove the standard Delete User option.

Replace with:
    Deactivate User
    Reactivate User

This prevents foreign key constraint failures and preserves audit integrity.

RBAC Rules

Only the following roles can perform user activation/deactivation:

Super Admin → Full access across all scopes
Admin → Only within their assigned Category + Environment scope

Other users must not have access to:

Deactivate User
Reactivate User

These actions should be hidden in UI and blocked at backend level.

Protection Rules
Self Protection

Users cannot deactivate or reactivate themselves.

This applies to:

Admin
Super Admin
Super Admin Protection

The last active Super Admin cannot be deactivated.

This protection must always remain.

Deactivate User Flow

When deactivated:

status changes to INACTIVE
all active sessions revoked
password cleared
MFA removed
tokens revoked
roles/groups/access removed

Optional audit fields:

deactivated_at
deactivated_by
reason

User remains in DB for historical tracking.

Reactivate User Flow

When reactivated:

status changes to ACTIVE
password reset required
MFA setup required again
Admin must reassign roles/groups manually

This avoids duplicate users and preserves ownership history.

Reactivation Popup

Show confirmation popup before reactivation:

Message

User will be reactivated and set to ACTIVE.

Please note:

Password reset required before login
MFA must be re-enabled
Roles and access must be reassigned manually

Buttons:

Cancel
Reactivate User
UI Changes

Instead of:

Remove the Delete Icon

Show:

Deactivate User Icon
Reactivate User Icon (Only for the Deactivated Users)

Display order:

Active Users first
Inactive Users below

Only Super Admin and scoped Admin should see these actions.

Audit Requirement

All audit ownership must remain linked to immutable user_id, not email.

Applies to:

created_by
updated_by
performed_by
approved_by
owner_id

Email remains display-only.

Final Recommendation

Use Active / Inactive + Reactivation as the standard lifecycle model.

Do not allow user deletion.

Enforce all lifecycle actions through existing RBAC rules.

This keeps VaultCred secure, scalable, and audit-safe.