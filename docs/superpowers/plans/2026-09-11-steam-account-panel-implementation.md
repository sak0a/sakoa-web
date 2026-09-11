# Implementation

1. Add application login-state and session tables, fixed-origin Steam OpenID verification, session endpoints and CSRF protection.
2. Add private account reads for identity, exact seasonal stats, donor status and permitted color settings; add atomic revision-checked color updates.
3. Add webRevision to the COLORS plugin schema, cached snapshots and write predicates. Refresh connected players when a newer web revision exists. Ship migration and deployment instructions.
4. Integrate the responsive account drawer and navigation trigger, loading/error/empty states, Steam return flow and editable chat preview.
5. Test authentication, authorization, concurrency and responsive interaction; run lint, typecheck, unit tests, build and plugin compilation. Document deployment requirements and unverified live checks.
