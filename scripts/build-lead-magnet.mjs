#!/usr/bin/env node
/**
 * Build standalone GTMx lead magnets from structured prospect JSON.
 *
 * Usage:
 *   node scripts/build-lead-magnet.mjs data/lead-magnets/nextgen.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_INPUT = path.join(ROOT, 'data', 'lead-magnets', 'nextgen.json');

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function attr(value) {
  return esc(value).replaceAll('\n', '&#10;');
}

function paraLines(value) {
  return esc(value).replaceAll('\n\n', '</p><p>').replaceAll('\n', '<br>');
}

const SAMPLE_VALUES = {
  '{{first_name}}': 'Dana',
  '{{company_name}}': 'NextGen AI Technologies',
  '{{open_role}}': 'customer support rep',
  '{{req_count}}': '6',
  '{{ai_tool}}': 'Intercom',
  '{{industry}}': 'healthcare operations',
  '{{named_agent}}': 'Maya',
};

function populateVariables(value) {
  let next = String(value ?? '');
  for (const [token, sample] of Object.entries(SAMPLE_VALUES)) {
    next = next.replaceAll(token, sample);
  }
  return next;
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function renderStats(stats) {
  return stats
    .map(
      (stat) => `
        <div class="metric-card">
          <strong>${esc(stat.value)}</strong>
          <span>${esc(stat.label)}</span>
        </div>`
    )
    .join('');
}

function renderRail(sections) {
  return sections
    .map(
      (section, index) => `
        <a class="rail-step" href="#${esc(section.id)}" data-section="${esc(section.id)}">
          <span class="rail-dot">${String(index + 1).padStart(2, '0')}</span>
          <span>${esc(section.label)}</span>
        </a>`
    )
    .join('');
}

function renderSectionHead(section, note) {
  return `
    <div class="section-head">
      <p class="eyebrow">${esc(section.label)}</p>
      <h2>${esc(section.title)}</h2>
      <p class="takeaway">${esc(section.takeaway)}</p>
      ${note ? `<span class="hand-note">${esc(note)}</span>` : ''}
    </div>`;
}

function renderTierChips(tiers, includeAll = false) {
  return `${includeAll ? '<button class="chip is-active" type="button" data-filter="all">All</button>' : ''}${tiers
    .map(
      (tier) =>
        `<button class="chip" type="button" data-filter="${esc(tier.id)}">${esc(tier.name)}</button>`
    )
    .join('')}`;
}

function renderTiers(tiers) {
  return tiers
    .map(
      (tier, index) => `
        <article class="tier-card accent-${esc(tier.accent)}" data-tier-card="${esc(tier.id)}" tabindex="0">
          <div class="tier-card__top">
            <span class="tier-num">${String(index + 1).padStart(2, '0')}</span>
            <span class="tier-share">${esc(tier.share)} TAM</span>
          </div>
          <h3>${esc(tier.name)}: ${esc(tier.label)}</h3>
          <p>${esc(tier.trigger)}</p>
          <div class="tier-reveal">
            <dl>
              <div><dt>Pain</dt><dd>${esc(tier.pain)}</dd></div>
              <div><dt>Offer</dt><dd>${esc(tier.magnet)}</dd></div>
              <div><dt>Source</dt><dd>${esc(tier.dataSource)}</dd></div>
              <div><dt>Reply density</dt><dd>${esc(tier.replyDensity)}</dd></div>
            </dl>
          </div>
          <button class="mini-btn" type="button">Open card</button>
        </article>`
    )
    .join('');
}

function renderRouting(rules) {
  return rules
    .map(
      (rule, index) => `
        <button class="route-rule${index === 0 ? ' is-active' : ''}" type="button" data-route="${index}">
          <span class="route-rule__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="route-rule__if">IF ${esc(rule.if)}</span>
          <strong>${esc(rule.then)}</strong>
          <em>${esc(rule.why)}</em>
        </button>`
    )
    .join('');
}

function renderCampaigns(campaigns) {
  return campaigns
    .map(
      (campaign) => `
        <article class="campaign-card" data-campaign-tier="${esc(campaign.tier)}" data-campaign-group="${esc(campaign.group)}">
          <div class="campaign-card__meta">
            <span>${esc(campaign.group)}</span>
            <span>${esc(campaign.targeting)}</span>
          </div>
          <h3>${esc(campaign.name)}</h3>
          <p>${esc(campaign.overview)}</p>
          <dl>
            <div><dt>Filter</dt><dd>${esc(campaign.filter)}</dd></div>
            <div><dt>AI strategy</dt><dd>${esc(campaign.strategy)}</dd></div>
            <div><dt>Value</dt><dd>${esc(campaign.value)}</dd></div>
          </dl>
        </article>`
    )
    .join('');
}

function renderEmails(emails) {
  return emails
    .map(
      (sequence, index) => `
        <details class="email-sequence" ${index === 0 ? 'open' : ''}>
          <summary>
            <span>
              <strong>${esc(sequence.label)}</strong>
              <em>${esc(sequence.magnet)}</em>
            </span>
            <b>Open sequence</b>
          </summary>
          <div class="email-tabs" role="tablist" aria-label="${attr(sequence.label)} steps">
            ${sequence.messages
              .map(
                (message, messageIndex) => `
                  <button class="email-tab${messageIndex === 0 ? ' is-active' : ''}" type="button" data-email-step="${messageIndex}" role="tab" aria-selected="${messageIndex === 0 ? 'true' : 'false'}">
                    <span>Step ${messageIndex + 1}</span>
                    <strong>${esc(message.day)}</strong>
                  </button>`
              )
              .join('')}
          </div>
          <div class="email-stack">
            ${sequence.messages
              .map(
                (message, messageIndex) => `
                  <article class="email-card${messageIndex === 0 ? ' is-active' : ''}" data-email-panel="${messageIndex}">
                    <div class="email-card__top">
                      <span>Step ${messageIndex + 1} · ${esc(message.day)}</span>
                      <div class="email-actions">
                        <button class="preview-btn" type="button">Preview variables</button>
                        <button class="copy-btn" type="button" data-copy="${attr(
                          `Subject: ${message.subject}\n\n${message.body}`
                        )}">Copy email</button>
                      </div>
                    </div>
                    <div class="email-subject">
                      <span>Subject</span>
                      <h3 data-template="${attr(message.subject)}" data-preview="${attr(populateVariables(message.subject))}">${esc(message.subject)}</h3>
                    </div>
                    <div class="email-body">
                      <div data-template="${attr(message.body)}" data-preview="${attr(populateVariables(message.body))}">
                        <p>${paraLines(message.body)}</p>
                      </div>
                    </div>
                  </article>`
              )
              .join('')}
          </div>
        </details>`
    )
    .join('');
}

function renderLaunch(items, thresholds) {
  return `
    <div class="launch-grid">
      <div class="launch-steps">
        ${items
          .map(
            (item, index) => `
              <div class="launch-step">
                <span>${String(index + 1).padStart(2, '0')}</span>
                <p>${esc(item)}</p>
              </div>`
          )
          .join('')}
      </div>
      <div class="thresholds">
        <h3>Scale / cut rules</h3>
        ${thresholds
          .map(
            (item) => `
              <div class="threshold">
                <strong>${esc(item.rate)}</strong>
                <span>${esc(item.action)}</span>
              </div>`
          )
          .join('')}
      </div>
    </div>`;
}

function renderHtml(data) {
  const sectionById = Object.fromEntries(data.sections.map((section) => [section.id, section]));
  const routeText = data.routingRules.map((rule, index) => `${index + 1}. IF ${rule.if} -> ${rule.then} (${rule.why})`).join('\n');
  const variablesText = data.variables.join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(data.company)} - GTMx Strategy Journey</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500;700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --cream: #F1E9D6;
      --lav: #E4E2F7;
      --white: #FFFFFF;
      --warm: #FCFAF4;
      --ink: #1B1813;
      --graphite: #4E4A43;
      --stone: #8B867C;
      --orange: #DD5A2F;
      --orange-soft: #F6D9C9;
      --peri: #6B62E6;
      --peri-soft: #C2BEF0;
      --sage: #4FA873;
      --sage-soft: #B7DCC1;
      --butter: #EFC456;
      --butter-soft: #F8E6AC;
      --lilac: #B78FD8;
      --lilac-soft: #D6BCE9;
      --display: 'Gabarito', system-ui, sans-serif;
      --body: 'DM Sans', system-ui, sans-serif;
      --mono: 'JetBrains Mono', ui-monospace, monospace;
      --hand: 'Caveat', cursive;
      --shadow: 7px 7px 0 var(--ink);
      --border: 2px solid var(--ink);
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 96px; }
    body {
      margin: 0;
      background: var(--cream);
      color: var(--ink);
      font-family: var(--body);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image: radial-gradient(rgba(27,24,19,.08) 1px, transparent 1px);
      background-size: 22px 22px;
      opacity: .26;
      z-index: -2;
    }
    a { color: inherit; }
    button { font: inherit; }
    .top-rule { height: 14px; background: var(--ink); }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
    .wordmark { font-family: var(--display); font-weight: 900; font-size: 30px; letter-spacing: -.04em; }
    .wordmark .dot { display: inline-block; width: 9px; height: 9px; border-radius: 99px; background: var(--orange); border: 1.5px solid var(--ink); margin-left: 3px; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      width: max-content;
      max-width: 100%;
      gap: 8px;
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--orange);
    }
    h1, h2, h3 { font-family: var(--display); margin: 0; line-height: 1.04; letter-spacing: -.02em; }
    p { margin: 0; color: var(--graphite); }

    .hero {
      position: relative;
      min-height: 92vh;
      display: grid;
      align-items: center;
      padding: 42px 0 80px;
      overflow: hidden;
    }
    .hero::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -120px;
      width: 980px;
      height: 320px;
      transform: translateX(-50%);
      border: var(--border);
      border-radius: 50% 50% 0 0;
      background: linear-gradient(135deg, var(--sage-soft), var(--peri-soft));
      opacity: .42;
      z-index: -1;
    }
    .brandbar { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 54px; }
    .artifact-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: var(--border);
      border-radius: 999px;
      background: var(--white);
      padding: 8px 14px;
      font-family: var(--mono);
      font-size: 12px;
      box-shadow: 4px 4px 0 var(--butter);
    }
    .hero-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) 420px; gap: 48px; align-items: center; }
    .hero h1 { max-width: 12ch; font-size: clamp(48px, 8vw, 92px); font-weight: 900; }
    .hero h1 mark {
      position: relative;
      background: transparent;
      z-index: 1;
      white-space: nowrap;
    }
    .hero h1 mark::after {
      content: "";
      position: absolute;
      left: -3%;
      right: -3%;
      bottom: .08em;
      height: .22em;
      background: var(--orange);
      border-radius: 60% 40% 55% 45%;
      z-index: -1;
      transform: rotate(-1deg);
    }
    .hero-copy { margin-top: 26px; max-width: 62ch; font-size: 20px; }
    .hero-card {
      position: relative;
      background: var(--white);
      border: var(--border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 8px 8px 0 var(--peri);
    }
    .hero-card h2 { font-size: 25px; margin-bottom: 10px; }
    .route-preview {
      margin-top: 22px;
      border: var(--border);
      border-radius: 16px;
      overflow: hidden;
      background: var(--warm);
    }
    .route-preview div { display: grid; grid-template-columns: 52px 1fr; border-bottom: var(--border); }
    .route-preview div:last-child { border-bottom: 0; }
    .route-preview span { display: grid; place-items: center; background: var(--butter-soft); border-right: var(--border); font-family: var(--mono); font-size: 12px; font-weight: 700; }
    .route-preview p { padding: 12px 14px; font-weight: 700; color: var(--ink); }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 30px; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 48px;
      border: var(--border);
      border-radius: 14px;
      padding: 13px 20px;
      font-family: var(--display);
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .btn:hover { transform: translate(-2px, -2px); }
    .btn-primary { background: var(--ink); color: var(--white); box-shadow: 4px 4px 0 var(--orange); }
    .btn-soft { background: linear-gradient(135deg, var(--sage-soft), var(--peri-soft)); color: var(--ink); box-shadow: 4px 4px 0 var(--ink); }
    .metric-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 30px; }
    .metric-card { background: var(--white); border: var(--border); border-radius: 14px; padding: 14px; box-shadow: 4px 4px 0 var(--sage-soft); }
    .metric-card strong { display: block; font-family: var(--display); font-size: 30px; line-height: .95; }
    .metric-card span { display: block; margin-top: 5px; color: var(--graphite); font-size: 13px; font-weight: 700; }

    .journey-shell { position: relative; display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 38px; align-items: start; }
    .progress-rail {
      position: sticky;
      top: 22px;
      min-height: calc(100vh - 44px);
      padding: 24px 0;
      z-index: 4;
    }
    .rail-card {
      position: relative;
      background: var(--warm);
      border: var(--border);
      border-radius: 18px;
      padding: 18px 14px;
      box-shadow: 5px 5px 0 var(--ink);
      overflow: hidden;
    }
    .rail-line {
      position: absolute;
      left: 30px;
      top: 58px;
      bottom: 28px;
      width: 3px;
      background: repeating-linear-gradient(to bottom, var(--ink), var(--ink) 8px, transparent 8px, transparent 15px);
      opacity: .4;
    }
    .engine-marker {
      position: absolute;
      left: 14px;
      top: 52px;
      width: 34px;
      height: 38px;
      display: grid;
      place-items: center;
      font-family: var(--display);
      font-weight: 900;
      font-size: 20px;
      background: var(--peri-soft);
      border: var(--border);
      clip-path: polygon(50% 0, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%);
      transition: transform .18s ease;
      z-index: 2;
    }
    .rail-title { margin-left: 48px; font-family: var(--display); font-weight: 900; line-height: 1; }
    .rail-steps { position: relative; display: grid; gap: 10px; margin-top: 22px; }
    .rail-step {
      display: grid;
      grid-template-columns: 34px 1fr;
      align-items: center;
      gap: 10px;
      color: var(--graphite);
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
    }
    .rail-dot {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border: var(--border);
      border-radius: 10px;
      background: var(--white);
      font-family: var(--mono);
      font-size: 11px;
      color: var(--ink);
    }
    .rail-step.is-active .rail-dot, .rail-step.is-complete .rail-dot { background: var(--orange); color: var(--white); }
    .rail-step.is-active { color: var(--ink); }
    .mobile-progress {
      display: none;
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--cream);
      border-bottom: var(--border);
      padding: 10px 14px;
    }
    .mobile-progress__bar { height: 9px; border: var(--border); border-radius: 999px; background: var(--white); overflow: hidden; }
    .mobile-progress__bar span { display: block; width: 0; height: 100%; background: var(--orange); transition: width .16s ease; }
    .mobile-progress__label { display: flex; justify-content: space-between; margin-top: 7px; font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }

    main { padding-bottom: 90px; }
    .journey-section {
      position: relative;
      padding: 96px 0;
      border-top: var(--border);
      z-index: 1;
      isolation: isolate;
    }
    .journey-section::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 200vw;
      transform: translateX(-50%);
      z-index: -1;
      background: transparent;
    }
    .journey-section:nth-child(even)::before { background: rgba(228, 226, 247, .42); }
    .section-head { position: relative; margin-bottom: 34px; max-width: 760px; }
    .section-head h2 { font-size: clamp(34px, 5vw, 56px); margin-top: 9px; }
    .takeaway {
      margin-top: 14px;
      font-size: 19px;
      max-width: 62ch;
      color: var(--graphite);
    }
    .hand-note {
      position: absolute;
      right: -80px;
      top: 10px;
      font-family: var(--hand);
      font-size: 30px;
      color: var(--orange);
      transform: rotate(-7deg);
    }
    .panel {
      background: var(--white);
      border: var(--border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 7px 7px 0 var(--ink);
    }
    .signal-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
    .reason-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .reason-card, .source-card {
      border: var(--border);
      border-radius: 16px;
      padding: 18px;
      background: var(--warm);
      min-height: 120px;
    }
    .reason-card span, .source-card span {
      display: inline-grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: var(--border);
      border-radius: 10px;
      background: var(--butter);
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 12px;
    }
    .source-list { display: grid; gap: 12px; }
    .source-card { min-height: auto; background: var(--white); }
    .source-card h3 { font-size: 18px; margin-bottom: 4px; }
    .field-cloud { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .field-cloud span {
      border: var(--border);
      border-radius: 999px;
      background: var(--orange-soft);
      padding: 8px 12px;
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 700;
    }
    .route-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 24px; align-items: start; }
    .route-rules { display: grid; gap: 12px; }
    .route-rule {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) 92px;
      gap: 12px;
      align-items: center;
      width: 100%;
      text-align: left;
      border: var(--border);
      border-radius: 16px;
      background: var(--white);
      padding: 13px;
      cursor: pointer;
      box-shadow: 4px 4px 0 transparent;
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .route-rule:hover, .route-rule.is-active { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--orange); background: var(--warm); }
    .route-rule__num { display: grid; place-items: center; width: 38px; height: 38px; border: var(--border); border-radius: 10px; background: var(--peri-soft); font-family: var(--mono); font-weight: 800; }
    .route-rule__if { font-weight: 800; color: var(--ink); }
    .route-rule strong { font-family: var(--display); }
    .route-rule em { grid-column: 2 / 4; color: var(--graphite); font-style: normal; font-size: 14px; }
    .code-box {
      background: var(--ink);
      color: #F4EFE2;
      border-radius: 18px;
      border: var(--border);
      padding: 18px;
      box-shadow: 6px 6px 0 var(--lilac);
    }
    .code-box pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.7;
    }
    .copy-btn, .mini-btn {
      border: var(--border);
      border-radius: 10px;
      background: var(--butter-soft);
      color: var(--ink);
      padding: 7px 10px;
      font-family: var(--display);
      font-weight: 800;
      cursor: pointer;
    }
    .copy-btn.copied { background: var(--sage-soft); }
    .tier-toolbar, .campaign-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 22px;
    }
    .chip {
      border: var(--border);
      border-radius: 999px;
      background: var(--white);
      padding: 9px 14px;
      font-family: var(--display);
      font-weight: 800;
      cursor: pointer;
    }
    .chip.is-active { background: var(--ink); color: var(--white); }
    .tier-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .tier-card {
      border: var(--border);
      border-radius: 20px;
      background: var(--white);
      padding: 22px;
      box-shadow: 7px 7px 0 var(--peri-soft);
      cursor: pointer;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .tier-card:hover, .tier-card.is-open { transform: translate(-3px, -3px); box-shadow: 10px 10px 0 var(--peri); }
    .tier-card.accent-orange { box-shadow: 7px 7px 0 var(--orange-soft); }
    .tier-card.accent-orange:hover, .tier-card.accent-orange.is-open { box-shadow: 10px 10px 0 var(--orange); }
    .tier-card.accent-sage { box-shadow: 7px 7px 0 var(--sage-soft); }
    .tier-card.accent-sage:hover, .tier-card.accent-sage.is-open { box-shadow: 10px 10px 0 var(--sage); }
    .tier-card.accent-lilac { box-shadow: 7px 7px 0 var(--lilac-soft); }
    .tier-card.accent-lilac:hover, .tier-card.accent-lilac.is-open { box-shadow: 10px 10px 0 var(--lilac); }
    .tier-card.accent-butter { box-shadow: 7px 7px 0 var(--butter-soft); }
    .tier-card.accent-butter:hover, .tier-card.accent-butter.is-open { box-shadow: 10px 10px 0 var(--butter); }
    .tier-card__top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    .tier-num, .tier-share {
      border: var(--border);
      border-radius: 999px;
      padding: 6px 10px;
      background: var(--warm);
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 800;
    }
    .tier-card h3 { font-size: 26px; margin-bottom: 8px; }
    .tier-card > p { font-weight: 700; color: var(--ink); }
    .tier-reveal { display: none; margin-top: 18px; }
    .tier-card.is-open .tier-reveal { display: block; }
    dl { margin: 0; display: grid; gap: 12px; }
    dt { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--orange); font-weight: 800; }
    dd { margin: 3px 0 0; color: var(--graphite); }
    .mini-btn { margin-top: 18px; background: var(--white); }
    .campaign-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .campaign-card {
      border: var(--border);
      border-radius: 18px;
      background: var(--white);
      padding: 18px;
      box-shadow: 5px 5px 0 var(--sage-soft);
    }
    .campaign-card[hidden] { display: none; }
    .campaign-card__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .campaign-card__meta span {
      border: var(--border);
      border-radius: 999px;
      background: var(--lav);
      padding: 5px 9px;
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 800;
    }
    .campaign-card h3 { font-size: 21px; margin-bottom: 8px; }
    .campaign-card p { margin-bottom: 15px; }
    .email-sequence {
      border: var(--border);
      border-radius: 18px;
      background: var(--white);
      margin-bottom: 16px;
      box-shadow: 5px 5px 0 var(--lilac-soft);
      overflow: hidden;
    }
    .email-sequence summary {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      padding: 18px 20px;
      cursor: pointer;
      border-bottom: var(--border);
      list-style: none;
    }
    .email-sequence summary::-webkit-details-marker { display: none; }
    .email-sequence summary strong { display: block; font-family: var(--display); font-size: 22px; }
    .email-sequence summary em { display: block; margin-top: 4px; color: var(--graphite); font-style: normal; }
    .email-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 18px 18px 0;
    }
    .email-tab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: var(--border);
      border-radius: 14px;
      background: var(--warm);
      padding: 12px 14px;
      cursor: pointer;
      text-align: left;
      box-shadow: 3px 3px 0 transparent;
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .email-tab:hover, .email-tab.is-active {
      transform: translate(-2px, -2px);
      background: var(--ink);
      color: var(--white);
      box-shadow: 4px 4px 0 var(--orange);
    }
    .email-tab span {
      font-family: var(--display);
      font-weight: 900;
      font-size: 18px;
    }
    .email-tab strong {
      font-family: var(--mono);
      font-size: 12px;
      color: inherit;
    }
    .email-stack { padding: 18px; }
    .email-card {
      display: none;
      border: var(--border);
      border-radius: 16px;
      background: var(--warm);
      padding: 22px;
      min-width: 0;
      box-shadow: 5px 5px 0 var(--ink);
    }
    .email-card.is-active { display: block; }
    .email-card__top { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 18px; }
    .email-card__top span { font-family: var(--mono); font-size: 12px; font-weight: 800; color: var(--orange); }
    .email-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
    }
    .preview-btn {
      border: var(--border);
      border-radius: 10px;
      background: var(--white);
      color: var(--ink);
      padding: 7px 10px;
      font-family: var(--display);
      font-weight: 800;
      cursor: pointer;
    }
    .preview-btn.is-active { background: var(--sage-soft); }
    .email-subject {
      border: var(--border);
      border-radius: 14px;
      background: var(--white);
      padding: 12px 15px;
      margin-bottom: 16px;
    }
    .email-subject span {
      display: block;
      margin-bottom: 5px;
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--stone);
    }
    .email-card h3 { font-size: clamp(20px, 2.1vw, 27px); word-break: break-word; letter-spacing: 0; line-height: 1.15; }
    .email-body {
      border: var(--border);
      border-radius: 14px;
      background: var(--white);
      padding: 18px 20px;
    }
    .email-body p {
      max-width: 72ch;
      font-size: 18px;
      line-height: 1.72;
      color: var(--ink);
    }
    .email-body mark {
      display: inline-block;
      white-space: nowrap;
      background: var(--butter-soft);
      border: 1px solid rgba(27, 24, 19, .35);
      border-radius: 6px;
      padding: 0 .18em;
      color: var(--ink);
    }
    .email-body p + p { margin-top: 16px; }
    .variable-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .variable-row span {
      border: var(--border);
      border-radius: 999px;
      background: var(--orange-soft);
      padding: 7px 11px;
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 800;
    }
    .launch-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
    .launch-steps { display: grid; gap: 14px; }
    .launch-step {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 14px;
      align-items: center;
      border: var(--border);
      border-radius: 16px;
      background: var(--white);
      padding: 15px;
      box-shadow: 4px 4px 0 var(--orange-soft);
    }
    .launch-step span {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border: var(--border);
      border-radius: 14px;
      background: var(--orange);
      color: var(--white);
      font-family: var(--mono);
      font-weight: 800;
    }
    .launch-step p { color: var(--ink); font-weight: 700; }
    .thresholds {
      border: var(--border);
      border-radius: 20px;
      background: var(--ink);
      color: var(--white);
      padding: 22px;
      box-shadow: 7px 7px 0 var(--butter);
    }
    .thresholds h3 { color: var(--white); font-size: 24px; margin-bottom: 16px; }
    .threshold { border-top: 1px dashed rgba(255,255,255,.35); padding: 13px 0; }
    .threshold strong, .threshold span { display: block; }
    .threshold strong { font-family: var(--display); color: var(--butter); }
    .threshold span { color: #F4EFE2; margin-top: 3px; }
    .final-cta {
      border-top: var(--border);
      padding: 78px 0 92px;
      background: var(--ink);
      color: var(--white);
      box-shadow: 50vw 0 0 var(--ink), -50vw 0 0 var(--ink);
    }
    .final-cta .panel {
      background: var(--cream);
      color: var(--ink);
      box-shadow: 9px 9px 0 var(--orange);
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 24px;
      align-items: center;
    }
    .final-cta h2 { font-size: clamp(34px, 5vw, 58px); }
    .final-cta p { margin-top: 10px; font-size: 18px; }
    .toast {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translate(-50%, 120px);
      background: var(--ink);
      color: var(--white);
      border-radius: 999px;
      padding: 11px 18px;
      font-family: var(--display);
      font-weight: 800;
      box-shadow: 4px 4px 0 var(--orange);
      transition: transform .22s ease;
      z-index: 20;
    }
    .toast.show { transform: translate(-50%, 0); }

    @media (max-width: 980px) {
      .hero-grid, .signal-layout, .route-layout, .launch-grid, .final-cta .panel { grid-template-columns: 1fr; }
      .journey-shell { display: block; }
      .progress-rail { display: none; }
      .mobile-progress { display: block; }
      .hero { min-height: auto; padding-top: 28px; }
      .campaign-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hand-note { position: static; display: inline-block; margin-top: 14px; }
    }
    @media (max-width: 680px) {
      .wrap { padding: 0 18px; }
      .brandbar { align-items: flex-start; flex-direction: column; margin-bottom: 36px; }
      .hero h1 { font-size: clamp(42px, 15vw, 68px); }
      .hero-copy { font-size: 18px; }
      .metric-strip, .reason-grid, .tier-grid, .campaign-grid, .email-tabs { grid-template-columns: 1fr; }
      .email-tab { align-items: flex-start; flex-direction: column; }
      .email-card { padding: 16px; }
      .email-body { padding: 15px; }
      .email-body p { font-size: 16px; line-height: 1.65; }
      .route-rule { grid-template-columns: 42px 1fr; }
      .route-rule strong { grid-column: 2; }
      .route-rule em { grid-column: 1 / 3; }
      .journey-section { padding: 72px 0; }
      .section-head h2 { font-size: 35px; }
      .takeaway { font-size: 17px; }
      .hero-actions .btn { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
    }
  </style>
</head>
<body>
  <div class="top-rule"></div>
  <div class="mobile-progress" aria-hidden="true">
    <div class="mobile-progress__bar"><span id="mobileBar"></span></div>
    <div class="mobile-progress__label"><span id="mobileLabel">Signal</span><span id="mobilePct">0%</span></div>
  </div>

  <header class="hero" id="top">
    <div class="wrap">
      <div class="brandbar">
        <div class="wordmark">gtmx<span class="dot"></span></div>
        <div class="artifact-pill">Custom strategy artifact - ${esc(data.date)}</div>
      </div>
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Prepared for ${esc(data.company)}</p>
          <h1>${esc(data.headline).replace('journey', '<mark>journey</mark>')}</h1>
          <p class="hero-copy">${esc(data.subheadline)}</p>
          <p class="hero-copy"><strong>Core insight:</strong> ${esc(data.coreInsight)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#signal">Start the journey</a>
            <a class="btn btn-soft" href="${attr(data.cta.primaryHref)}">${esc(data.cta.primaryLabel)}</a>
          </div>
          <div class="metric-strip">${renderStats(data.heroStats)}</div>
        </div>
        <aside class="hero-card">
          <p class="eyebrow">Campaign engine</p>
          <h2>One signal. One route. Five offers.</h2>
          <p>${esc(data.productSummary)}</p>
          <div class="route-preview">
            ${data.sections
              .slice(0, 4)
              .map((section, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(section.title)}</p></div>`)
              .join('')}
          </div>
        </aside>
      </div>
    </div>
  </header>

  <div class="wrap journey-shell">
    <aside class="progress-rail" aria-label="Journey progress">
      <div class="rail-card">
        <div class="rail-line"></div>
        <div class="engine-marker" id="engineMarker">x</div>
        <div class="rail-title">Strategy<br>journey</div>
        <nav class="rail-steps">${renderRail(data.sections)}</nav>
      </div>
    </aside>

    <main>
      <section class="journey-section" id="signal" data-section-label="${attr(sectionById.signal.label)}">
        ${renderSectionHead(sectionById.signal, 'strongest signal')}
        <div class="signal-layout">
          <div class="panel">
            <div class="reason-grid">
              ${data.signalReasons
                .map((reason, index) => `<div class="reason-card"><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(reason)}</p></div>`)
                .join('')}
            </div>
            <div class="field-cloud">${data.fields.map((field) => `<span>${esc(field)}</span>`).join('')}</div>
          </div>
          <aside class="source-list">
            ${data.sources.map((source, index) => `<div class="source-card"><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(source.name)}</h3><p>${esc(source.delivers)}</p></div>`).join('')}
          </aside>
        </div>
      </section>

      <section class="journey-section" id="waterfall" data-section-label="${attr(sectionById.waterfall.label)}">
        ${renderSectionHead(sectionById.waterfall, 'first match wins')}
        <div class="route-layout">
          <div class="route-rules">${renderRouting(data.routingRules)}</div>
          <aside class="code-box">
            <button class="copy-btn" type="button" data-copy="${attr(routeText)}">Copy routing spec</button>
            <pre id="routeCode">${esc(routeText)}</pre>
          </aside>
        </div>
      </section>

      <section class="journey-section" id="tiers" data-section-label="${attr(sectionById.tiers.label)}">
        ${renderSectionHead(sectionById.tiers, 'click each card')}
        <div class="tier-toolbar">${renderTierChips(data.tiers)}</div>
        <div class="tier-grid">${renderTiers(data.tiers)}</div>
      </section>

      <section class="journey-section" id="campaigns" data-section-label="${attr(sectionById.campaigns.label)}">
        ${renderSectionHead(sectionById.campaigns, 'volume + side quests')}
        <div class="campaign-toolbar">${renderTierChips(data.tiers, true)}</div>
        <div class="campaign-grid">${renderCampaigns(data.campaigns)}</div>
      </section>

      <section class="journey-section" id="emails" data-section-label="${attr(sectionById.emails.label)}">
        ${renderSectionHead(sectionById.emails, 'tiny yes CTA')}
        <div class="variable-row">
          ${data.variables.map((item) => `<span>${esc(item)}</span>`).join('')}
          <button class="copy-btn" type="button" data-copy="${attr(variablesText)}">Copy variables</button>
        </div>
        ${renderEmails(data.emails)}
      </section>

      <section class="journey-section" id="launch" data-section-label="${attr(sectionById.launch.label)}">
        ${renderSectionHead(sectionById.launch, 'launch first')}
        ${renderLaunch(data.launchPlan, data.thresholds)}
      </section>
    </main>
  </div>

  <section class="final-cta">
    <div class="wrap">
      <div class="panel">
        <div>
          <p class="eyebrow">Ready to run the waterfall</p>
          <h2>Next step: turn the strongest tier into booked replies.</h2>
          <p>Start with Tier 1, send the AI Workforce Blueprint offer, then scale the tiers that clear the reply-density threshold.</p>
        </div>
        <a class="btn btn-primary" href="${attr(data.cta.primaryHref)}">${esc(data.cta.primaryLabel)}</a>
      </div>
    </div>
  </section>

  <div class="toast" id="toast">Copied</div>

  <script>
    const sections = [...document.querySelectorAll('.journey-section')];
    const railSteps = [...document.querySelectorAll('.rail-step')];
    const marker = document.getElementById('engineMarker');
    const mobileBar = document.getElementById('mobileBar');
    const mobileLabel = document.getElementById('mobileLabel');
    const mobilePct = document.getElementById('mobilePct');
    const toast = document.getElementById('toast');

    function setActiveSection() {
      const scrollY = window.scrollY;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pagePct = Math.round((scrollY / maxScroll) * 100);
      mobileBar.style.width = pagePct + '%';
      mobilePct.textContent = pagePct + '%';

      let activeIndex = 0;
      sections.forEach((section, index) => {
        const top = section.getBoundingClientRect().top;
        if (top < window.innerHeight * 0.42) activeIndex = index;
      });

      const active = sections[activeIndex];
      mobileLabel.textContent = active?.dataset.sectionLabel || 'Journey';
      railSteps.forEach((step, index) => {
        step.classList.toggle('is-active', index === activeIndex);
        step.classList.toggle('is-complete', index < activeIndex);
      });

      if (marker && railSteps[activeIndex]) {
        const first = railSteps[0].offsetTop;
        const current = railSteps[activeIndex].offsetTop;
        marker.style.transform = 'translateY(' + Math.max(0, current - first) + 'px)';
      }
    }

    window.addEventListener('scroll', setActiveSection, { passive: true });
    window.addEventListener('resize', setActiveSection);
    setActiveSection();

    document.querySelectorAll('.route-rule').forEach((rule) => {
      rule.addEventListener('click', () => {
        document.querySelectorAll('.route-rule').forEach((item) => item.classList.remove('is-active'));
        rule.classList.add('is-active');
      });
    });

    document.querySelectorAll('[data-tier-card]').forEach((card) => {
      const toggle = () => card.classList.toggle('is-open');
      card.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        toggle();
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
      card.querySelector('.mini-btn')?.addEventListener('click', () => toggle());
    });

    function activateFilter(toolbar, filter) {
      toolbar.querySelectorAll('.chip').forEach((chip) => {
        chip.classList.toggle('is-active', chip.dataset.filter === filter);
      });
    }

    document.querySelectorAll('.tier-toolbar .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        activateFilter(chip.closest('.tier-toolbar'), filter);
        document.querySelector('[data-tier-card="' + filter + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelector('[data-tier-card="' + filter + '"]')?.classList.add('is-open');
      });
    });

    document.querySelectorAll('.campaign-toolbar .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        activateFilter(chip.closest('.campaign-toolbar'), filter);
        document.querySelectorAll('.campaign-card').forEach((card) => {
          const tier = card.dataset.campaignTier;
          card.hidden = !(filter === 'all' || tier === filter || tier === 'all');
        });
      });
    });

    document.querySelectorAll('.email-sequence').forEach((sequence) => {
      const tabs = [...sequence.querySelectorAll('.email-tab')];
      const panels = [...sequence.querySelectorAll('[data-email-panel]')];
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const step = tab.dataset.emailStep;
          tabs.forEach((item) => {
            const active = item.dataset.emailStep === step;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          panels.forEach((panel) => {
            panel.classList.toggle('is-active', panel.dataset.emailPanel === step);
          });
        });
      });
    });

    function formatEmailText(value, highlight) {
      const escaped = String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
      const paragraphs = escaped
        .split('\\n\\n')
        .map((paragraph) => '<p>' + paragraph.replaceAll('\\n', '<br>') + '</p>')
        .join('');
      if (!highlight) return paragraphs;
      return paragraphs.replace(
        /\\b(Dana|NextGen AI Technologies|customer support rep|6|Intercom|healthcare operations|Maya)\\b/g,
        '<mark>$1</mark>'
      );
    }

    document.querySelectorAll('.preview-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.email-card');
        const subject = card.querySelector('.email-subject h3');
        const body = card.querySelector('.email-body > div');
        const previewing = !card.classList.contains('is-previewing');
        card.classList.toggle('is-previewing', previewing);
        button.classList.toggle('is-active', previewing);
        button.textContent = previewing ? 'Show merge tags' : 'Preview variables';
        subject.textContent = previewing ? subject.dataset.preview : subject.dataset.template;
        body.innerHTML = formatEmailText(previewing ? body.dataset.preview : body.dataset.template, previewing);
      });
    });

    document.querySelectorAll('.copy-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const value = button.dataset.copy || '';
        try {
          await navigator.clipboard.writeText(value);
          button.classList.add('copied');
          const old = button.textContent;
          button.textContent = 'Copied';
          toast.classList.add('show');
          setTimeout(() => {
            button.textContent = old;
            button.classList.remove('copied');
            toast.classList.remove('show');
          }, 1200);
        } catch {
          toast.textContent = 'Copy not available';
          toast.classList.add('show');
          setTimeout(() => {
            toast.textContent = 'Copied';
            toast.classList.remove('show');
          }, 1200);
        }
      });
    });
  </script>
</body>
</html>`;
}

function main() {
  const inputArg = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_INPUT;
  const raw = fs.readFileSync(inputArg, 'utf8');
  const data = JSON.parse(raw);
  const outDir = path.join(ROOT, 'dist', 'lead-magnets');
  const publicDir = path.join(ROOT, 'public', 'lead-magnets');
  const outFile = path.join(outDir, `${slugify(data.slug || data.company)}.html`);
  const publicFile = path.join(publicDir, path.basename(outFile));
  const html = renderHtml(data);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outFile, html);
  fs.writeFileSync(publicFile, html);
  console.log(`Wrote ${path.relative(ROOT, outFile)}`);
  console.log(`Wrote ${path.relative(ROOT, publicFile)}`);
}

main();
