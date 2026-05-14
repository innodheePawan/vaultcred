Homepage Credential Generator

Add a lightweight Strong Credential Generator section on the homepage.

The feature should allow visitors to generate secure random credentials instantly without login or account creation.

Placement

Place the section:

below the Hero section
before the product feature sections

This keeps the homepage interactive while aligning with VaultCred’s security-focused positioning.

Generator Behavior
User Input

Only allow:

Password Length Selection

Range:

8–64 characters

using:

slider
or
numeric selector
Password Rules

Generated credentials must always include:

uppercase letters
lowercase letters
numbers
safe special characters

No optional toggles are required.

Safe Special Character Policy

Avoid special characters that commonly create issues in:

JSON
XML
shell scripts
URLs
environment variables
API payloads

Avoid characters such as:

"  '  \  `  <  >  &

Use only enterprise-safe special characters such as:

! @ # $ % ^ * - _ + =
Actions

Provide:

Generate Password
Copy Password

Optional:

Regenerate button
Password strength indicator
Security Requirement

Password generation must happen entirely client-side.

Do not:

store generated passwords
transmit passwords to backend APIs
log generated passwords anywhere
Informational Note

Add a small note below the generator:

Credentials are generated locally in your browser and are never stored or transmitted.

This improves trust and transparency for visitors.

Extensibility Requirement

The feature must be designed in a modular and extensible way so that it be reused in other places of the application.