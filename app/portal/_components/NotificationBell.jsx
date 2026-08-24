'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Icon from './Icon';
import { markAllNotificationsReadAction, markNotificationReadAction } from '../actions';

const KIND = {
  'lead.interested': { icon: 'leads', tone: 'mint', label: 'Lead' },
  'campaign.leads_added': { icon: 'stack', tone: 'blue', label: 'Campaign' },
  'campaign.launched': { icon: 'rocket', tone: 'gold', label: 'Campaign' },
  'campaign.message_market_fit': { icon: 'spark', tone: 'flame', label: 'Campaign' },
};

const FILTERS = [
  ['all', 'All'],
  ['lead', 'Leads'],
  ['campaign', 'Campaigns'],
];

function ago(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`;
}

function MarkAllButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="notif-markall" disabled={pending}>
      <Icon name="check" />
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  );
}

export default function NotificationBell({ items, unreadCount, latestId, readOnly }) {
  const ref = useRef(null);
  const [filter, setFilter] = useState('all');

  // The .lead-reply <details> pattern this reuses has no outside-click or Escape
  // handling. Fine for a per-row disclosure; not fine for chrome that sits open over
  // the whole sidebar. These are the two behaviours it genuinely lacks.
  useEffect(() => {
    function onPointerDown(event) {
      if (ref.current?.open && !ref.current.contains(event.target)) ref.current.open = false;
    }
    function onKeyDown(event) {
      if (event.key === 'Escape' && ref.current) ref.current.open = false;
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Filters the fetched page only, matching LeadSearch. With a 20-item page, "Leads"
  // shows leads within the newest 20 rather than all leads ever.
  const visible = items.filter((item) => filter === 'all' || item.kind.startsWith(filter));

  return (
    <details className="notif" ref={ref}>
      <summary aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
        <Icon name="bell" />
        {unreadCount > 0 ? (
          <span className="notif-badge" aria-live="polite">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </summary>
      <div className="notif-panel">
        <div className="notif-head">
          <div>
            <strong>Notifications</strong>
            <small>Activity across your campaigns</small>
          </div>
          {unreadCount > 0 && !readOnly ? (
            <form action={markAllNotificationsReadAction}>
              <input type="hidden" name="throughId" value={latestId} />
              <MarkAllButton />
            </form>
          ) : null}
        </div>
        <div className="notif-filters">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'is-active' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="notif-list">
          {visible.length ? (
            visible.map((item) => {
              const kind = KIND[item.kind] ?? { icon: 'bell', tone: 'blue', label: 'Update' };
              return (
                <article key={item.id} className={item.read ? '' : 'is-unread'}>
                  <span className={`notif-chip notif-chip--${kind.tone}`}>
                    <Icon name={kind.icon} />
                  </span>
                  <div>
                    <span className="notif-kind">
                      {kind.label}
                      {item.campaignName ? ` · ${item.campaignName}` : ''}
                    </span>
                    <strong>{item.title}</strong>
                    {item.body ? <p>{item.body}</p> : null}
                    <small>{ago(item.eventAt)}</small>
                  </div>
                  {!item.read && !readOnly ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button type="submit" aria-label="Mark as read" title="Mark as read">
                        <span className="notif-dot" />
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="portal-empty notif-empty">
              <span>✦</span>
              <h2>Nothing yet</h2>
              <p>New leads and campaign activity will land here.</p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
