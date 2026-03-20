# GigSuraksha

**AI-Enabled Parametric Income Protection for Quick-Commerce Delivery Partners**

_Guidewire DEVTrails 2026 — Phase 1 Submission_

> **Phase 1 Market Crash Update Included:** This README now includes a dedicated **Adversarial Defense & Anti-Spoofing Strategy** addressing coordinated GPS-spoofing fraud against parametric income protection systems.

---

## Problem Statement

India's quick-commerce delivery partners (Blinkit, Zepto, Instamart, BigBasket Now) earn within narrow time windows in hyperlocal zones around dark stores. When external disruptions — heavy rain, waterlogging, extreme heat, severe air pollution, zone closures, or platform outages — reduce their working hours, they lose income with no safety net.

A 3-hour rain event during the evening rush can cost a rider ₹400–₹600 in lost earnings, roughly 8–10% of their weekly income. These disruptions are frequent, measurable, and completely outside the rider's control.

Traditional insurance products (health, accident, vehicle) do not address this. **GigSuraksha** fills this gap with parametric income protection — covering **loss of income only**, triggered automatically by verified external events.

---

## Target Persona

**Primary**: Urban quick-commerce delivery riders operating in micro-zones around dark stores.

| Attribute | Value |
|---|---|
| Name | Ravi Kumar |
| City | Bengaluru |
| Platform | Blinkit |
| Work Pattern | 7–11 AM and 6–10 PM |
| Weekly Earnings | ₹5,500–₹6,500 |
| Problem | Loses earnings when rain, flooding, AQI spikes, or platform outages affect his shifts |

**Secondary**: Insurer/admin operators who monitor active policies, disruption triggers, claims, anomaly flags, and zone risk distribution.

---

## Why Quick-Commerce Riders

- **Hyperlocal dependency**: Earnings are tied to a specific dark store cluster and zone
- **Shift-sensitive income**: Disruptions during peak hours (evening rush) have disproportionate impact
- **High frequency of small disruptions**: 2–4 hour events are common and measurable
- **Structured data availability**: Weather APIs, AQI monitors, platform status feeds enable parametric triggers
- **Underserved segment**: No existing product protects gig workers against income loss from external disruptions

---

## What GigSuraksha Does

GigSuraksha is a **mobile-first, shift-aware parametric income protection platform**.

We do not insure vague monthly income. We insure **pre-declared earning windows** in **specific operating zones** on a **weekly protection plan**.

**How it works:**

1. **Declare your earning window** — Register your city, zone, platform, and the shift windows where you earn
2. **Get your weekly quote** — Our risk engine scores your zone and shifts. You see the exact premium breakdown
3. **Automatic payout on disruption** — When a verified disruption hits your zone during your shift, payout is calculated automatically

---

## Why Mobile-First PWA

- Delivery partners are smartphone-first users
- Progressive Web App is faster to build and deploy during a hackathon
- No app store dependency or approval delays
- Easier demo and judging experience
- Still provides a native mobile product feel

---

## Weekly Premium Model

The premium is calculated weekly with full transparency:

```text
Weekly Premium = Base Premium
               + Zone Risk Loading
               + Shift Exposure Loading
               + Coverage Factor
               - Safe Zone Discount
