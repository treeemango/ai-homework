# SQL Schema for Point & Solve AI

This folder contains all the database schema files for the Point & Solve AI application.

## Files

| File | Description |
|------|-------------|
| `01_tables.sql` | Core tables: profiles, solutions, achievements, user_achievements |
| `02_functions.sql` | Database functions for leaderboard, stats, and streak management |
| `03_indexes.sql` | Performance indexes for common queries |
| `04_seed.sql` | Initial data for achievements/badges |
| `05_rls_policies.sql` | Row-Level Security policies for Supabase |
| `06_views.sql` | Common views for stats and leaderboard |
| `07_ai_roles_quotas.sql` | AI usage logging, quotas, roles, student links |
| `08_solution_metadata.sql` | Adds AI metadata columns to solutions |
| `09_student_invites.sql` | Student invite codes for parent/teacher linking |

## Setup Instructions

Run the files in order using your Supabase SQL editor or psql:

```bash
psql -d your_database -f sql/01_tables.sql
psql -d your_database -f sql/02_functions.sql
psql -d your_database -f sql/03_indexes.sql
psql -d your_database -f sql/04_seed.sql
psql -d your_database -f sql/05_rls_policies.sql
psql -d your_database -f sql/06_views.sql
psql -d your_database -f sql/07_ai_roles_quotas.sql
psql -d your_database -f sql/08_solution_metadata.sql
psql -d your_database -f sql/09_student_invites.sql
```

Or paste each file's contents into the Supabase SQL Editor in order.

## Streak Cron Job

To automatically reset inactive streaks, set up a daily cron job in Supabase:

```sql
SELECT cron.schedule('reset-streaks', '0 0 * * *', 'SELECT reset_inactive_streaks()');
```

## Notes

- RLS policies assume Supabase authentication (`auth.uid()`).
- Functions use `SECURITY DEFINER` to run with elevated privileges.
