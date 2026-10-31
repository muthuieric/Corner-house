-- This migration version was created during billing-period-key testing and may already
-- exist in the remote Supabase migration history.
--
-- It is intentionally kept as a no-op so local migrations match the remote history
-- without converting anniversary billing keys such as 2026-05-28 into 2026-05.
-- Anniversary billing should use the billing cycle start date as the period key.

select pg_notify('pgrst', 'reload schema');
