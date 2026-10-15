# Journey Platform --- AI Development Agent Instructions

> **Purpose:** This file is the working contract for an AI coding agent
> implementing the Journey Platform.
>
> **Primary rule:** Follow the user's latest explicit instructions
> exactly. Work in small, verifiable steps. Do not invent requirements,
> redesign approved work, or make unrelated changes.

## 1. Project mission

Build a responsive travel/journey platform where users can:

-   Discover and search journey offers.
-   View detailed journey information.
-   Register, sign in, manage their profile, and view their bookings.
-   Create bookings for available journeys.
-   Complete a **simulated payment only** and view a booking
    confirmation/reference.
-   Explore organized group journeys and manage participants.
-   Build a personalized journey from transport, accommodation, and
    activities.
-   See the personalized journey total update as selections change.
-   Save and reopen a personalized itinerary draft.
-   Submit a custom-trip quote request for an agent/admin to review.

An administrator/agent must be able to manage journey offers and review
relevant bookings and quote requests.

This is a learning/demo application, not a live financial service. **Do
not implement real payments or collect real payment-card information.**

## 2. Fixed project decisions

Treat these decisions as fixed unless the user explicitly changes them.

-   **Frontend:** React.
-   **Backend:** Node.js with Express.
-   **Database:** PostgreSQL.
-   **Payment behavior:** simulated success/failure only; no real money
    moves.
-   **Application scope:** core booking MVP, organized group journeys,
    personalized journeys, basic administration, testing, and deployment
    preparation.
-   **Architecture:** one understandable application with separated
    frontend/backend code; do not introduce microservices.
-   **Budget:** aim for zero-cost development and free-tier services.
    Verify actual service limits before relying on a provider.
-   **Design reference:** the user will provide prototype
    screenshots/images. Use those images as the primary visual reference
    for the application UI.
-   **Requirements changes:** the user's latest direct instruction takes
    precedence over earlier instructions for the specific area it
    changes.

Do not change the technology stack, payment model, core scope, or
architecture merely because another approach is fashionable or
personally preferred.

## 3. Instruction-following contract

These rules are mandatory.

### 3.1 Follow instructions in priority order

1.  Follow platform and safety requirements.
2.  Follow the user's latest explicit instructions for the current task.
3.  Follow this project instruction file.
4.  Follow established project conventions found in the repository.
5.  Make conservative implementation choices only where the above do not
    specify an answer.

When a newer user instruction changes an earlier requirement, follow the
newer instruction **only within the scope of the change**. Preserve all
unaffected requirements.

### 3.2 Do not silently reinterpret requests

-   Do not replace the user's requested feature with a different
    feature.
-   Do not remove existing functionality to make implementation easier.
-   Do not change visual design, routes, data structures, libraries, or
    architecture without a clear need.
-   Do not add extra features, pages, dependencies, or abstractions that
    the user did not request.
-   Do not treat a prototype screenshot as permission to invent new
    business rules.
-   Do not assume missing requirements. If an ambiguity materially
    affects architecture, security, data, or user-visible behavior, ask
    one concise question before proceeding.
-   If a minor detail is missing and a safe conventional default is
    sufficient, choose the simplest default and state it in your report.
-   Do not claim a task is complete unless the relevant implementation
    and verification were actually performed.

### 3.3 Before making changes

1.  Inspect the existing repository and relevant files before editing.
2.  Identify the framework, package manager, folder structure, existing
    design system, routes, data models, and test commands.
3.  Check for existing implementations before creating new ones.
4.  Summarize the intended changes briefly.
5.  Identify any uncertainty, destructive action, or requirement
    conflict.
6.  If the task is clear, proceed without repeatedly asking the user to
    approve every small implementation detail.
7.  If a decision is essential and cannot be safely inferred, stop and
    ask the user.

### 3.4 Keep changes focused

-   Work on the requested feature and its necessary supporting changes
    only.
-   Do not rewrite unrelated files or refactor unrelated code.
-   Preserve existing working behavior unless the user asks to change
    it.
-   Prefer small, reviewable changes over a large rewrite.
-   Follow existing naming, formatting, and component patterns where
    reasonable.
-   Do not add a library if the existing stack can handle the
    requirement cleanly.
-   If a dependency is necessary, explain why before adding it when it
    materially changes the project.
-   Never delete user work, overwrite user files, reset branches, or run
    destructive commands without explicit permission.
-   Do not commit, push, publish, or deploy unless the user explicitly
    requests that action.

### 3.5 After each implementation unit

1.  Review the diff and ensure only relevant files changed.
2.  Run the relevant lint, type-check, build, and tests that are
    available.
3.  Fix regressions caused by the change.
4.  Report what changed, which checks ran, their actual results, and any
    remaining issues.
5.  If a check could not be run, say so clearly; never report it as
    passed.

## 4. Prototype images are the visual source of truth

The user will attach prototype images/screenshots alongside this
instruction file or in later messages. **Inspect the supplied images
before implementing or styling the related screen.** Do not start by
substituting a generic template.

### 4.1 Required image-review procedure

For every provided image:

1.  Identify which page, component, state, or viewport it represents.
2.  Inspect the layout hierarchy, alignment, spacing, sizing,
    typography, colors, borders, shadows, radii, icons, imagery, and
    visible text.
3.  Note the navigation, header, footer, sidebars, cards, forms,
    buttons, filters, tables, and responsive clues that are actually
    visible.
4.  Distinguish observed details from details that cannot be determined
    from a static screenshot.
5.  Compare the reference against the current application before
    editing.
6.  Implement the closest faithful version using reusable components and
    the existing stack.
7.  Check the result at a comparable viewport size and refine obvious
    visual mismatches.

### 4.2 Visual fidelity rules

-   Treat supplied prototype images as the primary reference for the
    corresponding screen.
-   Match the visible layout and hierarchy before adding decorative
    polish.
-   Preserve the reference's overall spacing, proportions, color
    palette, typography hierarchy, imagery style, and component shapes
    as closely as practical.
-   Use the exact visible labels and copy when they are legible and
    relevant.
-   Do not replace the design with a generic dashboard, generic travel
    template, or a different aesthetic.
-   Do not invent a new brand, color palette, logo, typography system,
    or page layout when the reference already establishes one.
-   Do not add gradients, animations, extra cards, extra sections,
    floating buttons, or other decoration unless shown in the prototype
    or requested.
-   Do not use unrelated stock imagery in place of supplied reference
    imagery.
-   If a visual detail is unclear, infer conservatively from the
    surrounding design. Ask only if the ambiguity materially changes the
    result.
-   A screenshot shows appearance, not necessarily behavior. Do not
    infer complex business logic solely from appearance.
-   If multiple screenshots conflict, follow the user's explanation and
    latest instruction. If no resolution is possible and the difference
    matters, ask which reference is authoritative.
-   If a required image is mentioned but not actually available to the
    agent, do not pretend to have seen it. Ask the user to attach it or
    continue only with clearly identified non-visual groundwork.

### 4.3 Responsive behavior

-   Reproduce the reference at its intended viewport first.
-   Then make the screen responsive without changing its identity.
-   Preserve content hierarchy and primary actions on smaller screens.
-   Avoid horizontal overflow, clipped controls, unreadable text, and
    overlapping elements.
-   Do not invent a separate mobile design unless requested or shown in
    mobile references.
-   If only desktop screenshots are supplied, use the same design
    language for mobile and make the minimum necessary adaptations.

### 4.4 Design consistency

-   Reuse existing components and styles when they match the prototype.
-   If several prototype screens share a header, button, card, field, or
    navigation pattern, implement a consistent reusable version.
-   Do not create multiple subtly different versions of the same
    component without a reason.
-   Prefer project-local design tokens/CSS variables when the visual
    references establish repeated colors, spacing, or radii.
-   Do not create a design system larger than the application needs.

## 5. Product behavior and scope

Implement the following capabilities incrementally, while respecting the
actual prototype and later user instructions.

### 5.1 Public journey discovery

-   Journey catalogue/list.
-   Search and filters such as destination, date, price, and duration
    where supported by the requirements and reference.
-   Journey detail page with available information such as itinerary,
    dates, transport, accommodation, price, and capacity.
-   Loading, empty-results, and error states.

### 5.2 Accounts and access

-   Registration, login, logout, and profile management.
-   Password reset if included in the current implementation scope.
-   Booking history for the signed-in user.
-   Enforce access control on the backend, not only by hiding frontend
    controls.
-   Users must not be able to read or modify another user's private
    data.
-   Admin-only functionality must be protected by backend authorization.

### 5.3 Booking and simulated payment

-   Validate journey existence, capacity, traveller count, and relevant
    booking data on the server.
-   Calculate prices using trusted server-side data.
-   Maintain clear booking/payment statuses.
-   Simulate success and failure without collecting card data.
-   Clearly label the payment interface as a simulation with no real
    charge.
-   Generate a booking reference/confirmation only according to the
    implemented booking state.
-   Make retries safe. Repeated clicks or repeated requests must not
    create duplicate successful payments or duplicate confirmations.
-   Do not claim a real transaction, refund, or bank settlement
    occurred.

### 5.4 Organized group journeys

-   Display organized journeys and their programs.
-   Support a booking for multiple participants.
-   Validate capacity.
-   Track participant/invitation status where implemented.
-   Do not implement real split payments or installment processing
    unless the user explicitly changes the scope. A simulated allocation
    may be used only if requested or clearly agreed.

### 5.5 Personalized journeys

-   Allow selection of transport, accommodation, and activities/options.
-   Update the displayed total when the selected options change.
-   Recalculate and validate totals on the server before
    saving/submitting.
-   Allow a signed-in user to save and reopen a draft.
-   Allow the user to submit a quote request.
-   Allow an authorized agent/admin to review the request and update its
    status.

### 5.6 Administration

-   Admin-only management of journey offers.
-   Create, edit, publish/unpublish, and archive/delete offers according
    to the existing data model and agreed behavior.
-   Review bookings and personalized-trip quote requests where included.
-   Do not expose admin controls or data to ordinary users.
-   Confirm destructive admin actions where appropriate.

## 6. Recommended implementation sequence

This is a technical dependency order, **not a sprint schedule**. Do not
create sprint reports, sprint goals, or project-management explanations
unless the user asks.

### Step 1 --- Inspect and understand the repository

-   [ ] Inspect the current directory and key files.
-   [ ] Identify installed dependencies and package manager.
-   [ ] Identify routes, page components, shared components, and styling
    conventions.
-   [ ] Identify current API endpoints and database access.
-   [ ] Identify existing tests, scripts, linting, and build commands.
-   [ ] Identify which supplied prototype image maps to which screen.
-   [ ] Summarize existing state and the smallest safe implementation
    plan.
-   [ ] Do not replace a working project with a fresh scaffold without
    explicit need and approval.

### Step 2 --- Establish project conventions

-   [ ] Follow the existing folder structure if it is sound.
-   [ ] Separate frontend, backend, configuration, and documentation
    clearly.
-   [ ] Configure environment variables and `.env.example`.
-   [ ] Ensure `.env`, credentials, and private data are ignored by Git.
-   [ ] Add or confirm setup instructions.
-   [ ] Choose one database access approach and use it consistently.
-   [ ] Avoid unnecessary dependencies and architectural complexity.

### Step 3 --- Model the data and business rules

-   [ ] Identify required entities and relationships.
-   [ ] Define user roles and authorization boundaries.
-   [ ] Define journey, booking, payment, participant, itinerary, and
    quote-request states needed by the current feature.
-   [ ] Use migrations for schema changes.
-   [ ] Use appropriate primary keys, foreign keys, unique constraints,
    and validation.
-   [ ] Represent money using an exact numeric/decimal type.
-   [ ] Store booking price snapshots where later offer changes must not
    rewrite past bookings.
-   [ ] Validate capacity and booking consistency safely.
-   [ ] Avoid storing unnecessary personal data.
-   [ ] Do not implement entities or fields without a functional need.

### Step 4 --- Build the shared UI foundation from the prototypes

-   [ ] Review all available prototype images before styling the related
    screens.
-   [ ] Identify recurring design patterns.
-   [ ] Implement shared layout/navigation and reusable buttons, fields,
    cards, and other repeated elements as needed.
-   [ ] Match the prototype's visual details rather than applying a
    generic theme.
-   [ ] Establish responsive behavior and shared style tokens only where
    justified.
-   [ ] Check keyboard focus, labels, contrast, and visible interaction
    states.
-   [ ] Do not invent screens that are not required. If a screen is
    necessary to complete a flow but no prototype exists, use the
    closest established design pattern and state the assumption.

### Step 5 --- Implement the core customer flow

Implement and verify in dependency order:

-   [ ] Registration and authentication.
-   [ ] Journey catalogue and search.
-   [ ] Journey detail.
-   [ ] Booking form and server-side availability validation.
-   [ ] Simulated payment success/failure.
-   [ ] Duplicate-request protection.
-   [ ] Booking confirmation/reference.
-   [ ] Booking history.

Do not move on from a broken core flow just to add more screens.

### Step 6 --- Add account and admin capabilities

-   [ ] Profile management.
-   [ ] Password reset if required.
-   [ ] Booking modification/cancellation only after rules are defined.
-   [ ] Admin authorization.
-   [ ] Journey offer CRUD and publication state.
-   [ ] Admin views for bookings/quote requests when required.
-   [ ] Tests for unauthorized access and invalid operations.

### Step 7 --- Add group journeys

-   [ ] Organized journey listing and details.
-   [ ] Multi-participant booking.
-   [ ] Capacity validation.
-   [ ] Participant/invitation tracking.
-   [ ] Clear status handling and tests.
-   [ ] Match the prototype's visual style.

### Step 8 --- Add personalized journeys

-   [ ] Option catalogue for transport, accommodation, and activities.
-   [ ] Add/remove options from an itinerary.
-   [ ] Display a recalculated total.
-   [ ] Validate options and totals on the backend.
-   [ ] Save and reopen a draft.
-   [ ] Submit a quote request.
-   [ ] Allow an authorized agent/admin to review and update the
    request.
-   [ ] Test ownership, invalid options, and price consistency.

### Step 9 --- Integrate, test, and harden

-   [ ] Run linting, type-checking if configured, and build.
-   [ ] Run unit and API integration tests.
-   [ ] Test main user flows end to end.
-   [ ] Test authorization and input validation.
-   [ ] Test repeated payment requests and retry scenarios.
-   [ ] Check responsive layouts against prototype images.
-   [ ] Check loading, empty, success, and failure states.
-   [ ] Fix regressions before adding more features.
-   [ ] Add a health endpoint and controlled server error handling if
    missing.
-   [ ] Ensure logs do not contain secrets or unnecessary personal
    information.

### Step 10 --- Document and prepare delivery

-   [ ] Update README setup instructions.
-   [ ] Document environment variables without real secrets.
-   [ ] Document database migrations and seed data.
-   [ ] Document API endpoints and error behavior.
-   [ ] Document test commands and actual results.
-   [ ] Document deployment configuration and known limitations.
-   [ ] Verify setup from a clean checkout when practical.
-   [ ] State clearly that payment is simulated.
-   [ ] Do not deploy or publish unless the user requests it.

## 7. Code quality and implementation rules

-   Use clear, descriptive names.
-   Keep functions and components focused.
-   Avoid duplicated business rules.
-   Avoid giant components that mix unrelated responsibilities.
-   Keep business rules and security checks on the backend.
-   Validate all untrusted input server-side.
-   Use parameterized queries or a safe ORM.
-   Return consistent API error responses.
-   Handle asynchronous loading and errors explicitly.
-   Use accessible semantic elements and labels.
-   Do not hardcode secrets, production URLs, credentials, or
    user-specific data.
-   Do not add fake data to production flows except as clearly
    identified demo/seed data.
-   Do not suppress lint/type/test errors merely to make a check pass.
-   Do not leave placeholder buttons that look functional but do
    nothing.
-   Do not fake successful email delivery, payment, deployment, or API
    integration.
-   Avoid premature optimization and overengineering.
-   Follow the existing repository's conventions unless they conflict
    with a clear user requirement or security.

## 8. Security and privacy rules

-   Never store plaintext passwords.
-   Never store real card numbers or card security codes.
-   Never trust a price, role, user ID, capacity, or payment result
    merely because it came from the frontend.
-   Enforce ownership and role checks in backend endpoints.
-   Keep credentials and secrets out of source control.
-   Do not put sensitive information in error responses or logs.
-   Use HTTPS in deployment when supported.
-   Collect only data needed for the current functionality.
-   Use synthetic data in public demos and screenshots.
-   Treat compliance with Moroccan Law 09-08/CNDP or any other law as
    requiring appropriate review; do not claim legal compliance without
    evidence and confirmation.

## 9. Testing and verification contract

For every meaningful change:

1.  Identify the relevant existing test command(s).
2.  Add or update tests for the behavior changed.
3.  Run the most relevant tests.
4.  Run the build/lint/type-check when available and appropriate.
5.  Inspect the diff for unrelated changes.
6.  Manually verify the UI against the supplied prototype when visual
    behavior changed.
7.  Report the exact checks that passed, failed, or could not run.

Minimum critical test cases:

-   Search filters produce expected results.
-   Invalid journey IDs and invalid inputs are handled safely.
-   Booking fails when capacity is insufficient.
-   Price is calculated from trusted server-side values.
-   Simulated payment success/failure updates state correctly.
-   Repeated payment requests do not duplicate successful results.
-   Users cannot access other users' bookings or drafts.
-   Non-admin users cannot access admin operations.
-   Group capacity is enforced.
-   Personalized itinerary totals remain consistent with selected
    options.
-   Saved drafts can only be accessed by their owner.
-   Quote requests are visible only to authorized users.
-   UI works at relevant desktop and mobile sizes.

If tests cannot run because dependencies, services, credentials, or
infrastructure are missing, explain the blocker and provide the exact
command or next action needed. Never invent test results.

## 10. Git and file safety

-   Inspect `git status` before changes when Git is available.
-   Do not discard existing uncommitted work.
-   Do not run destructive commands such as hard resets, forced
    checkouts, broad deletion, or database drops without explicit
    permission.
-   Do not stage, commit, push, merge, publish, or deploy unless the
    user specifically asks.
-   Before reporting completion, inspect the changed-file list and diff.
-   Avoid modifying lockfiles unless dependency changes require it.
-   Do not overwrite user-authored documentation without preserving
    relevant content.
-   If the requested task requires a destructive migration or
    irreversible action, stop and ask first.

## 11. Handling new instructions and change requests

The user may provide additional instructions after this file or request
changes during development. Treat them as binding within their stated
scope.

For each new instruction:

1.  Extract the exact requested change.
2.  Identify which pages, components, behavior, files, or requirements
    it affects.
3.  Identify constraints that must remain unchanged.
4.  Check for conflicts with earlier requirements.
5.  If the new instruction is clear, implement it directly and narrowly.
6.  If it conflicts with an earlier user instruction, the latest
    explicit instruction wins for the affected scope.
7.  Do not use the new instruction as permission to alter unrelated
    parts of the application.
8.  Verify the requested change and check for regressions.
9.  Report exactly what changed and what remained untouched.

When the user provides a visual change request: - Compare the request
with the relevant prototype and current implementation. - Apply the
requested difference while preserving the rest of the approved design. -
Do not redesign the entire page when the user asks to change one
component. - If the user says "only change X," do not change Y. - If the
user asks to restore an earlier design, use the supplied reference or
available project history when accessible; do not guess at the previous
appearance.

If the user's instructions are contradictory or cannot all be satisfied,
do not silently choose an interpretation. Briefly identify the conflict
and ask a focused question.

## 12. Agent communication format

Before a substantial task, provide a concise plan:

-   **Understanding:** what the user wants.
-   **Files/areas:** what you expect to change.
-   **Constraints:** relevant prototype, stack, and behavior
    requirements.
-   **Verification:** how you will check the result.

Then implement the task without unnecessary narration.

After implementation, report:

-   **Implemented:** concrete changes made.
-   **Files changed:** the relevant file paths.
-   **Verification:** commands run and actual outcomes.
-   **Prototype fidelity:** what was compared and any remaining visual
    differences, if applicable.
-   **Limitations/blockers:** only real unresolved issues.
-   **Next step:** only if useful.

Keep communication direct and practical. Do not repeat the entire
instruction file in progress reports.

## 13. Completion checklist

A task is not complete until the applicable items are checked.

-   [ ] The user's request has been implemented as specified.
-   [ ] Existing relevant behavior is preserved.
-   [ ] Prototype images were inspected for affected screens when
    available.
-   [ ] Visual changes match the reference as closely as practical.
-   [ ] No unrelated redesign or refactor was introduced.
-   [ ] Security and authorization were considered.
-   [ ] Relevant tests/checks were run, with truthful results reported.
-   [ ] Changed files and diffs were reviewed.
-   [ ] No secrets or sensitive demo data were added.
-   [ ] Documentation was updated if necessary.
-   [ ] Known limitations are disclosed.
-   [ ] No unrequested commit, push, deployment, or destructive action
    occurred.

## 14. Final operating principle

**Follow the user's instructions precisely, treat the provided
prototypes as the visual reference, preserve everything outside the
requested change, and verify before claiming success. When a requirement
is unclear and consequential, ask instead of guessing.**
