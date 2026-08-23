'use client';

import { useMemo, useState } from 'react';

function date(value) { return value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—'; }

export default function LeadSearch({ leads }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return leads; return leads.filter((lead) => [lead.fullName, lead.title, lead.company, lead.email, lead.campaignName].some((value) => value?.toLowerCase().includes(q))); }, [leads, query]);
  return <><div className="lead-toolbar"><label className="portal-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, email, or campaign" aria-label="Search positive leads" /></label><span>{filtered.length} positive {filtered.length === 1 ? 'lead' : 'leads'}</span></div>{filtered.length ? <div className="lead-list">{filtered.map((lead) => <article className="lead-row" key={`${lead.campaignId}-${lead.id}`}><div className="lead-person"><span className="lead-avatar">{lead.fullName.charAt(0)}</span><span><strong>{lead.fullName}</strong><small>{[lead.title, lead.company].filter(Boolean).join(' · ') || lead.email}</small></span></div><div className="lead-campaign"><small>Campaign</small><span>{lead.campaignName || 'Unknown campaign'}</span></div><div className="lead-date"><small>Received</small><span>{date(lead.dateReceived)}</span></div><details className="lead-reply"><summary>View reply</summary><div><strong>{lead.subject || 'Reply'}</strong><p>{lead.snippet || 'No reply preview is available.'}</p>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : null}</div></details></article>)}</div> : <div className="portal-empty"><span>⌕</span><h2>No matching leads</h2><p>Try a broader search or change the reporting period.</p></div>}</>;
}
