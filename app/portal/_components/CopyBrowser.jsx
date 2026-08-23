'use client';

import { useMemo, useState } from 'react';
import { htmlToPlainText } from '../../../lib/emailbison';

export default function CopyBrowser({ campaigns }) {
  const withCopy = campaigns.filter((item) => item.steps.length);
  const [selected, setSelected] = useState(withCopy[0]?.id ?? null);
  const campaign = useMemo(() => withCopy.find((item) => item.id === selected) ?? withCopy[0], [selected, withCopy]);
  if (!campaign) return <div className="portal-empty"><span>✎</span><h2>No copy synced yet</h2><p>Sequence copy will appear after the next EmailBison sync.</p></div>;
  return <div className="copy-browser"><aside><label>Campaign<select value={campaign.id} onChange={(event) => setSelected(event.target.value)}>{withCopy.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="copy-campaign-list">{withCopy.map((item) => <button type="button" className={item.id === campaign.id ? 'is-active' : ''} onClick={() => setSelected(item.id)} key={item.id}><strong>{item.name}</strong><span>{item.steps.length} steps · {item.sent.toLocaleString()} sent</span></button>)}</div></aside><section><header><div><span className="portal-kicker">Live sequence</span><h2>{campaign.name}</h2></div><span className="status-pill">{campaign.status}</span></header><ol className="sequence-list">{campaign.steps.map((step, index) => <li key={step.id}><div className="step-rail"><span>{index + 1}</span>{index < campaign.steps.length - 1 ? <i /> : null}</div><article><div className="step-meta"><strong>Email {index + 1}</strong><span>{index === 0 ? 'Sends immediately' : `Wait ${step.waitInDays} ${step.waitInDays === 1 ? 'day' : 'days'}`}{step.threadReply ? ' · Same thread' : ''}</span></div><div className="copy-subject"><small>Subject</small><p>{step.subject || '(no subject)'}</p></div><div className="copy-body">{htmlToPlainText(step.body) || 'No message body.'}</div></article></li>)}</ol></section></div>;
}
