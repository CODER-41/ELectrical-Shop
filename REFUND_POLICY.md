# Refund Policy Documentation

## Overview

Electronics Shop implements an enterprise-level refund system with multiple policies based on the reason for return. This ensures fair treatment for customers, suppliers, and the platform.

---

## Refund Policies

### 1. **Supplier Fault** (Default)
**When to use:** Defective product, wrong item sent, missing parts, product doesn't match description

**Financial Impact:**
- Customer receives: **100% refund** (full order amount)
- Supplier pays: **100%** (including platform commission)
- Platform pays: **0%** (no loss)

**Example:**
- Order Total: Ksh 10,000
- Customer Refund: Ksh 10,000
- Supplier Deduction: Ksh 10,000
- Platform Deduction: Ksh 0

**Rationale:** Supplier is responsible for product quality and accuracy. They absorb the full cost including the platform's commission.

---

### 2. **Customer Changed Mind**
**When to use:** Customer no longer wants the product, changed their mind, ordered wrong item

**Financial Impact:**
- Customer receives: **85% refund** (order amount minus 15% restocking fee)
- Supplier pays: **63.75%** (75% of refunded amount)
- Platform keeps: **Commission** (no refund of platform commission)
- Restocking fee: **15%** (covers handling costs)

**Example:**
- Order Total: Ksh 10,000
- Restocking Fee: Ksh 1,500 (15%)
- Customer Refund: Ksh 8,500
- Supplier Deduction: Ksh 6,375 (75% of 8,500)
- Platform Keeps: Ksh 2,125 (original commission)

**Rationale:** Customer bears cost of changing mind. Platform keeps commission as transaction was valid. Supplier loses their portion of the refunded amount.

---

### 3. **Shipping Damage**
**When to use:** Product damaged during delivery, packaging issues, courier mishandling

**Financial Impact:**
- Customer receives: **100% refund**
- Supplier pays: **0%** (not their fault)
- Platform pays: **100%** (platform absorbs full cost)

**Example:**
- Order Total: Ksh 10,000
- Customer Refund: Ksh 10,000
- Supplier Deduction: Ksh 0
- Platform Deduction: Ksh 10,000

**Rationale:** Platform is responsible for delivery logistics. Supplier shouldn't be penalized for shipping issues.

---

### 4. **Fraud/Chargeback**
**When to use:** Counterfeit product, fraudulent listing, severe misrepresentation

**Financial Impact:**
- Customer receives: **100% refund**
- Supplier pays: **110%** (full amount + 10% penalty)
- Platform receives: **10% penalty** (to cover investigation costs)

**Example:**
- Order Total: Ksh 10,000
- Customer Refund: Ksh 10,000
- Supplier Deduction: Ksh 11,000 (100% + 10% penalty)
- Platform Gains: Ksh 1,000 (penalty)

**Rationale:** Severe violations require penalties to deter fraud. Platform gains penalty to cover investigation and administrative costs.

---

## Return Window

- **Standard Products:** 14 days from delivery
- **Electronics:** 7 days from delivery (if unopened)
- **Custom Orders:** Non-returnable (unless defective)

---

## Return Process

### For Customers:

1. **Initiate Return**
   - Go to Orders → Select Order → Request Return
   - Provide reason and upload photos (if applicable)
   - Submit return request

2. **Admin Review**
   - Admin reviews request within 24-48 hours
   - Admin selects appropriate refund policy
   - Return is approved or rejected

3. **Ship Product Back**
   - Customer ships product to supplier/warehouse
   - Tracking number must be provided

4. **Refund Processing**
   - Once product received and verified
   - Refund processed within 5-7 business days
   - Refund sent via M-Pesa or original payment method

### For Suppliers:

1. **Return Notification**
   - Receive email/SMS when return is approved
   - View return details in supplier dashboard

2. **Receive Product**
   - Customer ships product back
   - Inspect product condition

3. **Deduction from Payout**
   - Refund amount deducted from next payout
   - If no pending payout, supplier must pay platform

### For Admins:

1. **Review Return Request**
   - Check customer reason and evidence
   - Review order history and product details
   - Contact supplier if needed

2. **Select Refund Policy**
   - Choose appropriate policy based on reason
   - Add admin notes explaining decision
   - Approve or reject return

3. **Process Refund**
   - Verify product returned (if applicable)
   - Initiate refund to customer
   - Deduct from supplier payout
   - Mark return as completed

---

## API Endpoints

### Approve Return with Policy
```http
POST /api/admin/returns/{return_id}/approve
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "refund_policy": "supplier_fault",  // or "customer_changed_mind", "shipping_damage", "fraud"
  "admin_notes": "Product was defective as reported"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "return-id",
    "status": "approved",
    "refund_policy": "supplier_fault",
    "refund_amount": 10000,
    "customer_refund": 10000,
    "supplier_deduction": 10000,
    "platform_deduction": 0,
    "restocking_fee": 0,
    "admin_notes": "Product was defective as reported"
  }
}
```

### Reject Return
```http
POST /api/admin/returns/{return_id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "admin_notes": "Return window expired"
}
```

### Process Refund
```http
POST /api/admin/returns/{return_id}/process-refund
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "refund_reference": "MPESA-REF-12345"
}
```

---

## Financial Reports

Refunds are tracked in financial reports with breakdown by policy:

- **Total Refunds:** Sum of all customer refunds
- **Supplier Deductions:** Amount deducted from supplier payouts
- **Platform Deductions:** Amount platform absorbed
- **Net Revenue:** Revenue minus total refunds

---

## Best Practices

### For Customers:
- Take photos/videos when unboxing products
- Report issues within 24 hours of delivery
- Keep original packaging for returns
- Provide detailed description of issues

### For Suppliers:
- Ensure accurate product descriptions
- Use quality packaging to prevent damage
- Respond promptly to return inquiries
- Maintain low return rate (<5%)

### For Admins:
- Review each return request carefully
- Be consistent in policy application
- Document decisions with clear notes
- Monitor supplier return rates

---

## Supplier Performance Metrics

High return rates affect supplier standing:

- **0-2% return rate:** Excellent (no action)
- **2-5% return rate:** Good (monitoring)
- **5-10% return rate:** Warning issued
- **>10% return rate:** Account review/suspension

---

## Dispute Resolution

If customer or supplier disputes the refund decision:

1. **Customer Appeal:** Contact support within 7 days
2. **Supplier Appeal:** Submit evidence within 3 days
3. **Admin Review:** Final decision within 5 business days
4. **Escalation:** Senior management review if needed

---

## Integration with Payouts

Refunds automatically affect supplier payouts:

1. **Pending Payouts:** Deducted from next payout
2. **No Pending Payout:** Supplier invoiced separately
3. **Negative Balance:** Supplier must pay before receiving future payouts

---

## Compliance

This refund policy complies with:
- Kenyan Consumer Protection Act
- E-Commerce Regulations
- Payment Card Industry (PCI) Standards
- M-Pesa Merchant Guidelines

---

## Contact

For refund policy questions:
- **Email:** refunds@electronicsshop.com
- **Phone:** +254 700 000 000
- **Support Hours:** Mon-Fri 8AM-6PM EAT

---

**Last Updated:** February 2026  
**Version:** 1.0
