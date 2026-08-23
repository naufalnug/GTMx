-- A single client can hold data from multiple EmailBison instances, which reuse
-- integer IDs. Add a `source` discriminator to every PK so dedi + gtmx rows for
-- the same client coexist without collisions.
alter table campaigns add column source text;
alter table campaign_daily_stats add column source text;
alter table sequence_steps add column source text;
alter table contacts add column source text;
alter table interested_replies add column source text;

-- Backfill existing data: storylane came from send.gtmx.run, skai from dedi.
update campaigns            set source = case when client = 'storylane' then 'gtmx' else 'dedi' end;
update campaign_daily_stats set source = case when client = 'storylane' then 'gtmx' else 'dedi' end;
update sequence_steps       set source = case when client = 'storylane' then 'gtmx' else 'dedi' end;
update contacts             set source = case when client = 'storylane' then 'gtmx' else 'dedi' end;
update interested_replies   set source = case when client = 'storylane' then 'gtmx' else 'dedi' end;

alter table campaigns            alter column source set not null;
alter table campaign_daily_stats alter column source set not null;
alter table sequence_steps       alter column source set not null;
alter table contacts             alter column source set not null;
alter table interested_replies   alter column source set not null;

alter table campaigns            drop constraint campaigns_pkey,            add primary key (client, source, campaign_id);
alter table campaign_daily_stats drop constraint campaign_daily_stats_pkey, add primary key (client, source, campaign_id, date);
alter table sequence_steps       drop constraint sequence_steps_pkey,       add primary key (client, source, campaign_id, step_id);
alter table contacts             drop constraint contacts_pkey,             add primary key (client, source, lead_id);
alter table interested_replies   drop constraint interested_replies_pkey,   add primary key (client, source, reply_id);;
