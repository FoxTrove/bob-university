# Analytics Feature Specification

## Overview

The Analytics section of the Bob University admin dashboard provides comprehensive insights into business performance, user engagement, and content effectiveness. This document details the metrics, data sources, and implementation details.

## Date Range Selection

### Quick Select Options
- **Today (1d)**: Current day data
- **Last 7 days (7d)**: Rolling 7-day window
- **Last 30 days (30d)**: Rolling 30-day window (default)
- **Last 90 days (90d)**: Quarterly view
- **Last year (1y)**: Annual view
- **Custom**: User-defined date range picker

### Period Comparison
All metrics automatically compare to the equivalent previous period:
- 30d selected → compares to the 30 days before
- Display format: `+15.3%` (green) or `-8.2%` (red)

## Analytics Pages

### 1. Overview Dashboard (`/analytics`)

The main dashboard provides a KPI summary and quick access to detailed views.

#### KPI Cards
| Metric | Description | Source |
|--------|-------------|--------|
| Revenue | Total revenue in period | `purchases.amount_cents` |
| Active Users (MAU) | Monthly active users | `video_progress.last_watched_at` |
| New Users | Users signed up in period | `profiles.created_at` |
| Churn Rate | % cancelled subscriptions | `entitlements.status = 'canceled'` |
| Conversion Rate | Free-to-paid conversion | `entitlements.plan` changes |

#### Charts
- **Revenue Trend**: Line chart of daily revenue
- **User Growth**: Dual-line chart (total users + new users)
- **Platform Distribution**: Pie chart (iOS vs Android)

---

### 2. Revenue Analytics (`/analytics/revenue`)

Deep-dive into financial metrics.

#### KPI Cards
| Metric | Description | Formula/Source |
|--------|-------------|----------------|
| Total Revenue | Sum of all completed purchases | `SUM(purchases.amount_cents)` where status = 'completed' |
| MRR | Monthly Recurring Revenue | `(individual_count × $49) + (salon_count × $97)` |
| ARPU | Average Revenue Per User | `Total Revenue ÷ Total Users` |
| Refund Rate | % of purchases refunded | `refunded_count ÷ total_purchases × 100` |

#### Charts
- **Revenue Over Time**: Daily/monthly revenue trend
- **Revenue by Product**: Pie chart (Subscription/Event/Certification/Merch)
- **Revenue by Platform**: Bar chart (iOS/Apple vs Android/Stripe)

#### Data Table
- Recent transactions with export to CSV
- Columns: Date, User, Product Type, Source, Amount, Status

---

### 3. User Analytics (`/analytics/users`)

User growth, engagement, and retention metrics.

#### KPI Cards
| Metric | Description | Source |
|--------|-------------|--------|
| Total Users | All registered users | `COUNT(profiles)` |
| New Users | Signups in period | `profiles.created_at` filter |
| MAU | Monthly Active Users | Unique users with `video_progress` in 30d |
| Conversion Rate | Free→Paid | `paid_users ÷ total_entitlements × 100` |

#### Active Users Panel
- **DAU**: Daily Active Users (last 24h)
- **WAU**: Weekly Active Users (last 7d)
- **MAU**: Monthly Active Users (last 30d)
- **DAU/MAU Ratio**: Stickiness metric (higher = more engaged)

#### Charts
- **User Growth**: Total and new users over time
- **Users by Plan**: Pie chart (Free/Individual/Salon)
- **Platform Distribution**: Bar chart (iOS/Android)

#### Retention Cohorts Table
| Cohort | Week 0 | Week 1 | Week 2 | Week 4 |
|--------|--------|--------|--------|--------|
| Nov 4  | 100%   | 65%    | 52%    | 41%    |
| Nov 11 | 100%   | 58%    | 48%    | -      |

Color-coded cells: Green (≥60%) → Yellow (40-60%) → Red (<40%)

---

## Technical Implementation

### Architecture

```
admin/src/
├── app/(dashboard)/analytics/
│   ├── page.tsx              # Overview dashboard
│   ├── AnalyticsOverview.tsx # Client component with charts
│   ├── revenue/
│   │   ├── page.tsx          # Revenue page
│   │   └── RevenueAnalytics.tsx
│   └── users/
│       ├── page.tsx          # Users page
│       └── UserAnalytics.tsx
├── app/api/analytics/
│   ├── overview/route.ts     # Overview API
│   ├── revenue/route.ts      # Revenue API
│   └── users/route.ts        # Users API
├── components/analytics/
│   ├── DateRangeSelector.tsx
│   ├── MetricCard.tsx
│   ├── AnalyticsLineChart.tsx
│   ├── AnalyticsBarChart.tsx
│   ├── AnalyticsPieChart.tsx
│   ├── ChartCard.tsx
│   └── ExportCSVButton.tsx
└── lib/
    ├── analytics.ts          # Date utilities, formatters
    └── analytics-queries.ts  # Supabase query functions
```

### Dependencies
- `recharts` - Charting library
- `date-fns` - Date manipulation

### Data Flow
1. Page loads with Suspense fallback (skeleton loading)
2. Client component mounts and calls API route
3. API route authenticates via Supabase session
4. Queries execute in parallel where possible
5. Data returned and rendered in charts

### Key Query Patterns

#### Revenue Over Time
```sql
SELECT
  DATE(created_at) as date,
  SUM(amount_cents) as revenue
FROM purchases
WHERE status = 'completed'
  AND created_at BETWEEN $start AND $end
GROUP BY DATE(created_at)
ORDER BY date
```

#### Active Users
```sql
SELECT DISTINCT user_id
FROM video_progress
WHERE last_watched_at >= NOW() - INTERVAL '30 days'
```

#### Retention Cohorts
```sql
-- For each cohort week, find users who signed up
-- Then check their activity in subsequent weeks
WITH cohort AS (
  SELECT user_id, DATE_TRUNC('week', created_at) as signup_week
  FROM profiles
)
SELECT
  signup_week,
  COUNT(DISTINCT CASE WHEN activity_week = 0 THEN user_id END) as week0,
  COUNT(DISTINCT CASE WHEN activity_week = 1 THEN user_id END) as week1,
  ...
FROM cohort
JOIN video_progress ON ...
GROUP BY signup_week
```

---

## Future Enhancements (Phase 2)

### Content Analytics (`/analytics/content`)
- Total watch time trend
- Video completion rates by module
- Most/least watched videos
- Drop-off analysis
- Content freshness indicator

### Event Analytics (`/analytics/events`)
- Event revenue summary
- Attendance rates
- No-show tracking
- Capacity utilization
- Early bird conversion

### Certification Analytics (`/analytics/certifications`)
- Certifications issued
- Pass/fail rates
- Revenue from certifications
- Time-to-certify metrics

### Additional Features
- Scheduled email reports
- Custom dashboard builder
- Real-time metrics
- Predictive analytics (churn prediction)

---

## Database Optimization

For performance at scale, consider:

1. **Materialized Views**: Pre-aggregate daily stats
2. **Indexes**: Ensure indexes on date columns
3. **Partitioning**: Partition large tables by date
4. **Caching**: Redis cache for common queries

Example materialized view:
```sql
CREATE MATERIALIZED VIEW analytics_daily_revenue AS
SELECT
  DATE(created_at) as date,
  source,
  product_type,
  COUNT(*) as transaction_count,
  SUM(amount_cents) as total_cents
FROM purchases
WHERE status = 'completed'
GROUP BY DATE(created_at), source, product_type;

-- Refresh nightly
REFRESH MATERIALIZED VIEW analytics_daily_revenue;
```

---

## Metrics Glossary

| Metric | Definition | Business Importance |
|--------|------------|---------------------|
| **MRR** | Monthly Recurring Revenue from active subscriptions | Core revenue health |
| **ARR** | Annual Recurring Revenue (MRR × 12) | Growth planning |
| **ARPU** | Average Revenue Per User | Monetization efficiency |
| **LTV** | Lifetime Value of a customer | Customer acquisition budgeting |
| **CAC** | Customer Acquisition Cost | Marketing efficiency |
| **Churn Rate** | % of subscribers who cancel | Retention health |
| **DAU/MAU** | Stickiness ratio | Product engagement |
| **NPS** | Net Promoter Score | Customer satisfaction |
| **Retention** | % users active after N days | Product-market fit |
| **Conversion** | % free users becoming paid | Funnel efficiency |
