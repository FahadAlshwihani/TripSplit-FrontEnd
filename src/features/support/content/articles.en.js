// Frontend-local, structured help content -- shipped with the app, not
// a CMS (there is no backend model for this; see docs/UI_UX_REDESIGN_
// HANDOFF.md's "Knowledge Base" note). Each category is a plain data
// object {title, icon, intro, sections: [{id, heading, paragraphs,
// bullets?, steps?, callout?}]} that SupportArticlePage renders
// generically. Kept in its own per-language file (not i18n JSON) so
// the flat locale files don't balloon with deeply-nested long-form
// text -- see articles.ar.js for the Arabic counterpart, same shape.
const articles = {
  'getting-started': {
    title: 'Getting Started',
    icon: 'rocket_launch',
    intro: 'A quick tour of what TripSplit is and how to set a trip up the right way from day one.',
    sections: [
      {
        id: 'what-is-tripsplit',
        heading: 'What TripSplit is',
        paragraphs: [
          'TripSplit is a shared ledger for a trip: everyone’s spending, personal and shared, lives in one place instead of scattered chat messages and mental math.',
          'A trip can also have a Trip Fund — a collective pot members contribute to up front, which then pays for expenses directly instead of everyone paying out of pocket and settling up later.',
          'At the end (or any time), Balances shows who owes whom, and TripSplit works out the smallest set of transfers to settle everything.',
          'Both registered accounts and guests (no account needed) can fully participate in a trip — add expenses, contribute to the Fund, and settle balances.',
        ],
      },
      {
        id: 'creating-a-trip',
        heading: 'Creating a trip',
        paragraphs: [
          'A new trip needs just a title, optional start/end dates, and a base currency — that’s it.',
          'There is no separate "trip budget" field to fill in. The Trip Fund’s target amount is the trip’s budget, and you set that from the Fund page whenever you’re ready (even later, not necessarily at creation).',
        ],
      },
      {
        id: 'opening-a-trip',
        heading: 'Opening a trip',
        paragraphs: [
          'Every trip has a short, shareable URL. Opening it as a registered member takes you straight into the trip; opening it as a guest keeps you recognized on that device even if you close the tab and come back later.',
          'A plain trip link is different from an invite/join link: opening the trip link requires you to already be a member, while a join link is what actually lets a new person in (see "Inviting members" below).',
        ],
      },
      {
        id: 'inviting-members',
        heading: 'Inviting members',
        paragraphs: [
          'There are two ways to bring someone in: a direct invitation (sent to a specific person) or a general join link anyone with it can use.',
          'How the join link behaves depends on the trip’s access policy, set in Settings or Governance (both control the exact same thing):',
        ],
        bullets: [
          'Open — the join link admits new members immediately, no approval needed.',
          'Approval required — the join link still works, but an owner/admin must approve each request before it’s final.',
          'Invite-only — the general join link stops admitting anyone new; only direct invitations still work.',
        ],
        callout: { type: 'tip', text: 'If the trip has a password set, anyone joining — through any method — needs it too. It’s an extra layer on top of the access policy, not a replacement for it.' },
      },
      {
        id: 'roles',
        heading: 'Roles',
        paragraphs: ['Every member has a role that determines what they can manage:'],
        bullets: [
          'Owner — full control, including transferring ownership and every admin capability.',
          'Admin — can manage members, access settings, and most trip configuration.',
          'Member — can add expenses, contribute to the Fund, and settle balances like anyone else, without admin-level controls.',
          'Guest — an identity type, not a role: a guest can hold any of the roles above (a guest can even be the Owner) without ever creating an account.',
        ],
      },
      {
        id: 'dashboard-overview',
        heading: 'Finding your way around',
        paragraphs: ['Each trip has its own workspace with these sections:'],
        bullets: [
          'Overview — a snapshot of spending, your balance, and recent activity.',
          'Expenses — the full expense ledger: add, edit, filter, search.',
          'Balances — who owes whom, and settling up.',
          'Fund — the collective pot: target, contributions, rounds, reimbursements.',
          'Members — who’s on the trip and their roles.',
          'Activity — a timeline of everything that happened.',
          'Governance — access policy, invitations, join requests, bans.',
          'Settlements — the full settlement history.',
          'Settings — trip details, access & security, and your own account shortcut.',
          'Support — you’re here.',
        ],
      },
      {
        id: 'first-time-flow',
        heading: 'A good first-time flow',
        paragraphs: ['If you’re starting a brand-new trip, this order tends to work well:'],
        steps: [
          'Create the trip (title, dates, currency).',
          'Set the access policy — open, approval-required, or invite-only — and a password if you want one.',
          'Set a Fund target on the Fund page, if you’re collecting money up front.',
          'Start the first Funding Round so members know what to contribute.',
          'Invite members — direct invitations or the join link.',
          'Start recording expenses as they happen.',
          'Settle up balances once the trip winds down (or any time along the way).',
        ],
      },
    ],
  },

  expenses: {
    title: 'Expenses & Splits',
    icon: 'receipt_long',
    intro: 'How to log spending accurately — who paid, who owes what, and how the Trip Fund fits in.',
    sections: [
      {
        id: 'creating-an-expense',
        heading: 'Creating an expense',
        paragraphs: ['Every expense has a title, category, amount, date, and at least one payer. Add it from the Expenses page and it appears in the ledger immediately.'],
      },
      {
        id: 'payment-sources',
        heading: 'Who actually paid: a member, or the Fund',
        paragraphs: [
          'An expense is paid either by one or more members out of pocket, or by the Trip Fund directly.',
          'When the Fund pays, the Fund’s cash balance goes down by that amount — and no member personally owes that share, since the group already covered it together through their earlier contributions.',
        ],
      },
      {
        id: 'shared-vs-personal',
        heading: 'Shared vs. personal expenses',
        paragraphs: [
          'A shared expense splits its cost across the members you choose. A personal expense is scoped to just one member — useful for tracking your own spending on the trip without it affecting anyone’s balance.',
        ],
      },
      {
        id: 'multiple-payers',
        heading: 'Multiple payers',
        paragraphs: ['If more than one person chipped in for the same expense (e.g. two people split a taxi fare on the spot), you can record multiple payers on one expense instead of creating separate entries.'],
      },
      {
        id: 'split-methods',
        heading: 'Split methods',
        paragraphs: ['Choose how a shared expense divides among participants:'],
        bullets: [
          'Equal — the simplest: split evenly across everyone included.',
          'Exact — you set the exact amount each person owes (useful when shares genuinely aren’t equal).',
          'Percentage — you set each person’s share as a percentage.',
          'Shares/weighted — assign relative weights (e.g. 2 shares vs. 1 share) and TripSplit does the math.',
        ],
      },
      {
        id: 'fund-paid-behavior',
        heading: 'What happens when the Fund pays',
        paragraphs: [
          'A Fund-paid expense reduces the Fund’s cash the moment it’s recorded — it does not create a personal debt between members for that portion, because it was already paid for collectively.',
        ],
      },
      {
        id: 'categories',
        heading: 'Categories and budgets',
        paragraphs: [
          'Expenses are organized into categories — a set of sensible defaults, plus any custom categories you add.',
          'A category can carry a planning budget: a soft target to help you track spending against a plan. It’s guidance, not an enforced spending limit — nothing is blocked if you go over.',
        ],
      },
      {
        id: 'editing-deleting',
        heading: 'Editing and removing expenses',
        paragraphs: [
          'You can edit an expense’s details at any time. Removing one takes it out of active totals and balances immediately — it stops affecting who owes what — while the record itself is preserved for history rather than erased outright.',
        ],
      },
      {
        id: 'foreign-currency',
        heading: 'Foreign currency',
        paragraphs: [
          'If an expense is in a different currency than the trip’s base currency, TripSplit converts it and keeps a snapshot of the rate used at the time — so later exchange-rate movements never silently change a past expense’s recorded value.',
        ],
      },
      {
        id: 'ledger-tools',
        heading: 'Finding things in the ledger',
        paragraphs: ['The Expenses page supports filtering by category, date range, and payer, plus a search box — and tapping any row opens its full details.'],
      },
    ],
  },

  fund: {
    title: 'Trip Fund',
    icon: 'savings',
    intro: 'The collective pot: how it’s funded, how it pays for things, and how leftover money gets sorted out.',
    sections: [
      {
        id: 'what-is-the-fund',
        heading: 'What the Trip Fund is',
        paragraphs: [
          'The Trip Fund is a shared pot of money the group contributes to up front, so the trip can pay for things directly instead of members constantly paying out of pocket and settling up afterward.',
          'It’s tracked completely separately from the personal balance ledger — the Fund has its own running cash total, distinct from who-owes-whom between members.',
        ],
      },
      {
        id: 'budget-semantics',
        heading: 'The Fund target IS the trip budget',
        paragraphs: [
          'There is no separate, independent "trip budget" concept. The Fund’s target amount (set on the Fund page) is the one and only budget figure for the trip.',
        ],
      },
      {
        id: 'funding-rounds',
        heading: 'Funding Rounds',
        paragraphs: [
          'A Funding Round is one collection attempt: a target amount, a set of participants, and a split method (equal, exact, percentage, or shares — the same options expenses use).',
          'You can run more than one round over the life of a trip — each is its own attempt. If a round falls short, starting a new round does not double the overall budget; the target stays whatever you set it to.',
        ],
      },
      {
        id: 'contribution-lifecycle',
        heading: 'How a contribution moves through its lifecycle',
        paragraphs: ['A single member’s contribution within a round goes through clear states:'],
        bullets: [
          'Expected — what they’re asked to contribute, not yet reported.',
          'Pending — they’ve reported sending it; it’s awaiting confirmation.',
          'Confirmed — the Fund holder verified it arrived; it now counts toward the Fund’s cash.',
          'Rejected — the Fund holder didn’t receive it. The contributor can retry ("check again" on the same reported transfer) or report an entirely new transfer, which is tracked as its own separate attempt.',
        ],
      },
      {
        id: 'fund-holder',
        heading: 'The Fund holder',
        paragraphs: [
          'The Fund holder is the person contributions are actually sent to and who confirms they’ve arrived — an operational responsibility, not an automatic consequence of being an Admin. Any suitable member can hold this role.',
        ],
      },
      {
        id: 'fund-accounting',
        heading: 'How the Fund’s available balance is worked out',
        paragraphs: [
          'In plain terms: the Fund’s available cash is everything confirmed as contributed, minus whatever the Fund has since paid for directly, minus any reimbursements paid out to members, minus any refunds already given back.',
        ],
      },
      {
        id: 'fund-paid-expenses',
        heading: 'Fund-paid expenses',
        paragraphs: ['When an expense is marked as paid by the Fund rather than by a member, it draws down the Fund’s available balance directly — see the Expenses & Splits article for how that’s recorded.'],
      },
      {
        id: 'reimbursements',
        heading: 'Reimbursements',
        paragraphs: [
          'Sometimes a member ends up personally covering something the Fund should have paid for (e.g. paying a vendor directly while the Fund hadn’t transferred money yet). A reimbursement reconciles that: the Fund pays the member back for the real amount they were owed, so nobody is paid twice for the same cost.',
        ],
      },
      {
        id: 'shortfall-topup',
        heading: 'Shortfall and topping up',
        paragraphs: ['If confirmed contributions fall short of what’s needed, a new Funding Round can be opened to close the gap — it’s simply another collection attempt against the same Fund.'],
      },
      {
        id: 'refunds',
        heading: 'Refunds',
        paragraphs: [
          'If the Fund ends up with a surplus, it can be refunded back out to members. A refund is a real, confirmed return of money — tracked with the same care as a contribution, including respecting the rights of members who contributed but may have since left the trip.',
        ],
      },
      {
        id: 'funding-history',
        heading: 'Funding history',
        paragraphs: ['Every round and every contribution’s full history — reported, confirmed/rejected, retried — stays visible on the Fund page, so nothing about how the Fund reached its current balance is hidden.'],
      },
      {
        id: 'fund-links',
        heading: 'Sharing a link to a round',
        paragraphs: ['Any Funding Round can be shared as a direct link that opens straight to it — useful for nudging someone to check their contribution status without them having to find it themselves.'],
      },
    ],
  },

  settlements: {
    title: 'Settling Balances',
    icon: 'account_balance_wallet',
    intro: 'What your balance means, how TripSplit minimizes transfers, and how a settlement gets confirmed.',
    sections: [
      {
        id: 'what-a-balance-means',
        heading: 'What your personal balance means',
        paragraphs: ['On the Balances page, your number means exactly one of three things:'],
        bullets: [
          'Positive — the group owes you money overall.',
          'Negative — you owe the group money overall.',
          'Zero — you’re fully settled up.',
        ],
      },
      {
        id: 'fund-vs-personal',
        heading: 'Fund balance vs. personal balances',
        paragraphs: ['These are two different things: the Trip Fund’s own cash balance (what’s left in the collective pot) is separate from your personal balance (what you specifically owe or are owed relative to the group).'],
      },
      {
        id: 'simplified-debts',
        heading: 'Why you don’t see every individual debt',
        paragraphs: ['Instead of listing every single pairwise debt from every expense, TripSplit works out the minimum number of transfers needed to settle everyone up — so instead of five small payments crisscrossing the group, you might just see one or two.'],
      },
      {
        id: 'suggested-settlements',
        heading: 'Suggested settlements',
        paragraphs: ['Based on that simplification, Balances suggests exactly who should pay whom, and how much, to bring everyone to zero.'],
      },
      {
        id: 'settlement-flow',
        heading: 'How a settlement actually happens',
        paragraphs: ['The normal flow starts with the person who owes money:'],
        steps: [
          'The debtor sends the money outside the app (bank transfer, cash, whatever works) and marks "I Paid" — this creates a pending settlement.',
          'The creditor reviews it: confirm it arrived, mark it as not received, or check again later if they’re not sure yet.',
        ],
      },
      {
        id: 'record-payment-received',
        heading: '"Record Payment Received"',
        paragraphs: ['If the creditor already knows money arrived (maybe it was recorded outside the usual flow), they can confirm it immediately themselves rather than waiting on the debtor’s own report.'],
      },
      {
        id: 'admin-external-record',
        heading: 'When an admin records a settlement on someone’s behalf',
        paragraphs: ['An admin can log a settlement that happened outside the app for administrative record-keeping — this documents that it happened, but it never fakes or substitutes for the actual creditor’s own confirmation of receiving the money.'],
      },
      {
        id: 'rejected-recovery',
        heading: 'If a settlement gets rejected',
        paragraphs: [
          'The original rejected transfer stays in the history — nothing is deleted. "Check again" reopens that exact same transfer for another look; reporting a brand-new payment instead creates a separate, independent record rather than overwriting the old one.',
        ],
      },
      {
        id: 'confirmed-settlements',
        heading: 'Once a settlement is confirmed',
        paragraphs: ['It becomes a permanent part of the trip’s history — with a timestamp, who recorded and who reviewed it, and any notes left along the way, all visible in its timeline.'],
      },
      {
        id: 'settlement-history-page',
        heading: 'Settlement History',
        paragraphs: ['The Settlements page lists every settlement across the whole trip, at any stage, in one place.'],
      },
      {
        id: 'why-old-settlements-still-show-actions',
        heading: 'Why an old settlement can still show action buttons',
        paragraphs: ['History itself never changes — but the buttons available on a settlement depend on its CURRENT state, not when it happened. A rejected settlement from weeks ago can still be retried today if it was never resolved another way.'],
      },
      {
        id: 'reimbursements-and-balances',
        heading: 'Reimbursements aren’t settlements',
        paragraphs: ['A Fund reimbursement (see the Trip Fund article) reconciles a member’s personal claim against the Fund — it’s a real, tracked transaction, but it’s a Fund operation, not a settlement between two members, and it’s never used to fake one.'],
      },
    ],
  },
};

export default articles;
