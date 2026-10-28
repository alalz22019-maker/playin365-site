# Golden Subscription & Payment — 29 October 2026

## Purpose

Golden Subscription & Payment connects the academy, guardian/payer, and player to one governed financial record without replacing the existing subscription, cashier, finance, guardian-payment, or player-wallet services.

## Golden journey

```text
Academy creates and activates a fee plan
→ Academy assigns the plan to an active member/athlete
→ The system assigns a verified guardian as payer when available
→ Academy issues one invoice per subscription and billing period
→ Payer submits bank-transfer/cash/card-terminal evidence
→ The submission remains pending and is not treated as paid
→ Academy finance approves or rejects the submission
→ Approval atomically creates Payment + Receipt + Ledger + Entitlement
→ The subscription becomes active only after a fully paid invoice or a zero-value plan
→ Guardian sees payment evidence and receipt
→ Player sees membership, invoice status, receipt, and entitlement without private payer details
```

## Roles and authority

### Academy / finance

- Creates fee plans and activates them.
- Assigns subscriptions to active members.
- Issues invoices and prevents duplicate billing periods.
- Reviews payer submissions.
- Records verified cash, bank-transfer, card-terminal, or external collection.
- Can pause, resume, complete, or cancel subscriptions while preserving the financial history.

### Guardian / payer

- Sees invoices assigned to the verified payer relationship.
- Submits a payment method, amount, reference, and private note.
- Can cancel an unreviewed submission.
- Receives a verified receipt after finance approval.
- Does not directly write `payments.status=paid`.

### Player

- Sees the plan, subscription state, invoice outcome, receipt, and entitlement.
- Does not see guardian transfer references, private notes, or provider details.
- Cannot pay a guardian-assigned invoice.

## Financial integrity

The single settlement function locks the invoice, validates the outstanding balance, creates the payment, updates invoice state, splits revenue and VAT, writes balanced ledger entries, creates the receipt, and activates the subscription entitlement after full settlement.

Acceptance example:

- Invoice subtotal: SAR 100.00
- VAT: SAR 15.00
- Payment: SAR 115.00
- Cash clearing debit: SAR 115.00
- Subscription revenue credit: SAR 100.00
- Tax payable credit: SAR 15.00
- Ledger balance: SAR 0.00

## Gateway rule

Online gateway payment is unavailable unless an organization integration has `status = connected` and `credential_state = configured`. Existing Moyasar, Tap, HyperPay, PayTabs, and Geidea catalog entries remain experimental and are not represented as live connections.

## UI

The route `subscriptionPayment` adds a live financial journey canvas, plan-to-entitlement stage rail, subscription contract, invoices, payer submissions, finance review, verified receipts, channel readiness, role privacy explanations, and Smart Home signals.

Approved geometry is reused exactly: academy `TL`, guardian `TR`, player `BR`.

## Compatibility

Preserved routes include `opsSubscriptions`, `opsCashier`, `opsFinance`, guardian payment pages, player wallet, and existing ERP/finance functions. The new journey coordinates these capabilities and does not delete them.

## Local acceptance

- PostgreSQL parse: 111 statements.
- Database journey: PASS.
- Activation before payment: BLOCKED.
- Player payment against guardian invoice: BLOCKED.
- Unconfigured gateway attempt: BLOCKED.
- Payment submission and finance approval: PASS.
- Receipt and entitlement: PASS.
- Ledger balance: PASS.
- Private payer reference and note leak to player: FALSE.
- Mobile horizontal overflow at 390×844: 0.
- Touch targets below 40px: 0.
- Interactive sheets: PASS.
