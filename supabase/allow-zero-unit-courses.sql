-- Supports non-credit curriculum requirements such as SGE100X.
alter table public.courses drop constraint if exists courses_credits_check;
alter table public.courses add constraint courses_credits_check check (credits between 0 and 12);
