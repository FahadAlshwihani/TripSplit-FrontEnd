# Trip Budget vs. Trip Fund — product decision and next-phase plan

Recorded during the Create Trip UX polish pass. Nothing in this document
is implemented yet — it exists so the next task starts from an agreed
decision instead of re-deriving it.

## The decision

**Trip Budget** and **Trip Fund** are not the same thing, and must never
be conflated in code or UI.

- **Trip Budget** — a planning number. What the trip is expected to
  cost, set once at creation (`Trip.budget`, currently optional). Pure
  metadata; nothing downstream currently derives money movement from it.
- **Trip Fund** — the trip's actual pooled money, contributed by real
  members through real contribution records (see `apps/funds` on the
  backend — `FundingRound`, `FundContribution`, etc., already exist and
  are unrelated to `Trip.budget`).

Entering `Trip Budget = 5,000 SAR` at creation must **not** cause
`Fund balance` to become `5,000 SAR`. The fund balance is, and must
remain, the sum of actual recorded contributions — `0 SAR` until members
actually contribute, regardless of what budget was planned.

This task (Create Trip UX polish) explicitly did **not** implement any
Budget → Fund linkage. `Trip Budget` on the Create Trip page remains
planning metadata only, exactly as it already was.

## Planned next-phase flow (not built yet)

The intended future flow, to be scoped as its own task:

```
Trip created
  → optional "Set up Trip Fund"
      A. Split fund target equally across members
      B. Custom contribution amounts/percentages per member
      C. Skip for now
```

Worked example: a trip with `Trip Budget = 6,000 SAR` and 3 members,
using the equal-split option, would set an *expected* contribution of
`2,000 SAR` per member — this is a target/ask, not a balance. The actual
`Fund balance` stays `0 SAR` until members record real contributions
against that target, through the existing `apps/funds` contribution
flow.

## Why this matters for implementation

- The equal-split/custom-split step is a **target-setting** UI, not a
  money-movement operation — it should write to something like a
  per-member "expected contribution" field, never directly to fund
  balance or create synthetic `FundContribution` rows.
- Skipping fund setup at creation must remain a fully valid, permanent
  state — a trip is not required to ever have a fund.
- This flow belongs after trip creation succeeds (a distinct step or
  page), not inside the Create Trip form itself — Create Trip's own
  scope stays limited to trip metadata (title, dates, currency, budget,
  join policy, password), matching how it already works today.
