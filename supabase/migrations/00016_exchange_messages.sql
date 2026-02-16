-- Exchange Messages: threaded communication between exchange parties
create table exchange_messages (
    id              uuid primary key default gen_random_uuid(),
    exchange_id     uuid not null references referral_exchanges(id) on delete cascade,
    sender_user_id  uuid not null references auth.users(id) on delete cascade,
    message         text not null check (char_length(message) > 0 and char_length(message) <= 2000),
    created_at      timestamptz default now()
);

-- Indexes
create index idx_exchange_messages_thread on exchange_messages (exchange_id, created_at desc);

-- RLS
alter table exchange_messages enable row level security;

-- Select: sender or receiver of the exchange can read
create policy "exchange_messages_select" on exchange_messages for select
using (exists (
    select 1 from referral_exchanges re
    where re.id = exchange_messages.exchange_id
      and (re.sender_user_id = auth.uid() or re.receiver_user_id = auth.uid())
));

-- Insert: must be a party to the exchange and exchange must be accepted
create policy "exchange_messages_insert" on exchange_messages for insert
with check (
    sender_user_id = auth.uid()
    and exists (
        select 1 from referral_exchanges re
        where re.id = exchange_messages.exchange_id
          and re.status = 'accepted'
          and (re.sender_user_id = auth.uid() or re.receiver_user_id = auth.uid())
    )
);
