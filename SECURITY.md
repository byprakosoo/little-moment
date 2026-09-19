# Security policy

Little Moment stores private family journals. Treat every deployment as a private application and use a separate database and credential set for each family or household.

## Do not commit secrets

- Never commit `.env.local`, database URLs, OAuth client secrets, SMTP passwords, App Passwords, or Better Auth secrets.
- Use `.env.example` only as a placeholder reference.
- Rotate any credential that was accidentally exposed before opening a repository or sharing a deployment.
- Do not use a shared production database for unrelated families.

## Reporting a vulnerability

Please open a private GitHub security advisory when available. If that feature is not enabled, contact the repository maintainers privately before opening a public issue. Include reproduction steps and avoid attaching real journal data, photos, tokens, or credentials.
