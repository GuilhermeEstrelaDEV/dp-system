# Homologation Accessibility Evidence

## State

`PENDING HUMAN EXECUTION`

Static source review and automated component tests do not replace this keyboard/dialog execution.
The reviewer must avoid the mouse while running the primary pass and attach evidence for each
failure.

## Keyboard commands

- `TAB`: move forward through interactive controls;
- `SHIFT+TAB`: move backward;
- `ENTER`: activate links, primary buttons and form submission;
- `SPACE`: activate buttons, checkboxes and other applicable controls;
- `ESC`: dismiss dialogs or transient surfaces where dismissal is supported.

## Global acceptance criteria

- focus is always visible;
- tab order follows the visual and semantic order;
- every actionable button or link is reachable and has an understandable accessible name;
- labels are associated with their form fields;
- required state and validation errors are perceivable without color alone;
- focus enters a dialog predictably, remains usable and returns to the invoking control;
- `ESC` behavior is consistent with the component contract;
- no keyboard trap occurs;
- status, warning and error meaning is not expressed only by color;
- disabled and pending actions cannot be submitted twice.

## Manual keyboard script

| Flow                | Keys/actions                                                                            | Expected result                                                                                    | PASS / FAIL | Evidence | Notes |
| ------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- | -------- | ----- |
| Login               | `TAB`, `SHIFT+TAB`, enter email/password, `ENTER` submit                                | Focus order is logical; labels and error are announced/perceivable; submit cannot duplicate        | `PENDING`   |          |       |
| Main navigation     | Traverse skip link, header and navigation with `TAB`/`SHIFT+TAB`; activate with `ENTER` | Skip link reaches main content; every visible destination is reachable once in logical order       | `PENDING`   |          |       |
| Company switch      | Open selector, traverse company cards and activate one                                  | Active company changes without focus loss or stale-company content                                 | `PENDING`   |          |       |
| Open form           | Reach a create/edit action and activate it                                              | Form heading receives understandable context and first relevant control is reachable               | `PENDING`   |          |       |
| Form fields         | Traverse text, select, date and checkbox controls; use `SPACE` where applicable         | Labels, required state, values and help/error associations are perceivable                         | `PENDING`   |          |       |
| Form validation     | Submit an invalid form with `ENTER`                                                     | Errors appear close to fields, are perceivable, and focus can reach each invalid control           | `PENDING`   |          |       |
| Successful submit   | Correct fields and submit once                                                          | Pending state prevents double-submit and success/navigation is perceivable                         | `PENDING`   |          |       |
| Cancel              | Reach cancel and activate with `ENTER`                                                  | Returns to the expected list/detail without unintended mutation                                    | `PENDING`   |          |       |
| Table actions       | Traverse representative DataTable rows and actions                                      | Action names include adequate context, spacing is visual, and all authorized actions are reachable | `PENDING`   |          |       |
| Dialog open         | Activate a modal/dialog action                                                          | Focus moves into the dialog and dialog name/description is understandable                          | `PENDING`   |          |       |
| Dialog traversal    | Cycle forward/backward with `TAB`/`SHIFT+TAB`                                           | No focus escapes unexpectedly and no keyboard trap prevents reaching controls                      | `PENDING`   |          |       |
| Dialog cancel       | Press `ESC` and use the explicit cancel control                                         | Supported dismissal works and focus returns to the invoker; no mutation occurs                     | `PENDING`   |          |       |
| Close period        | Reach readiness and close controls; confirm via keyboard                                | Blockers are perceivable; valid close can be confirmed once; pending state prevents duplication    | `PENDING`   |          |       |
| Reopen period       | Reach reopen, enter a reason and confirm via keyboard                                   | Reason label/error is perceivable; action is reachable and submits once                            | `PENDING`   |          |       |
| Error response      | Exercise a safe validation/conflict/permission error                                    | Message is understandable, focus remains recoverable and meaning is not color-only                 | `PENDING`   |          |       |
| Negative capability | Use the HR demonstration identity and navigate directly to a protected route            | Restricted state is perceivable and no hidden action becomes keyboard reachable                    | `PENDING`   |          |       |

## Static and automated evidence already available

- login fields have explicit labels and shared error association;
- the application shell includes a skip link;
- shared tables use semantic table markup and named action controls;
- focus styles and status text exist in the shared visual system;
- frontend unit tests, typecheck and build pass.

These checks support `Accessibility static: PASS`; they do not change the manual result from
`PENDING HUMAN EXECUTION`.

## Session record

- tested commit: _pending_;
- reviewer: _pending_;
- date/time: _pending_;
- browser/version: _pending_;
- assistive technology, if used: _pending_;
- final keyboard/dialog decision: `PENDING HUMAN EXECUTION`.
