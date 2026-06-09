export function deriveInsights(campaigns) {
  const insights = [];
  if (!campaigns.length) return insights;

  const meaningful = campaigns.filter((c) => c.sent >= 100);

  const topPositive = [...campaigns]
    .filter((c) => c.interested > 0)
    .sort((a, b) => b.interested - a.interested)[0];
  if (topPositive) {
    const rateText =
      topPositive.replies > 0
        ? ` (${topPositive.interestedRate.toFixed(0)}% of replies)`
        : '';
    insights.push({
      kind: 'positive',
      label: 'Most positive replies',
      text: `${topPositive.name} — ${topPositive.interested} positive ${topPositive.interested === 1 ? 'reply' : 'replies'}${rateText} on ${formatInt(topPositive.sent)} sent.`,
    });
  }

  const best = [...meaningful].sort((a, b) => b.replyRate - a.replyRate)[0];
  if (best && best.replyRate > 0 && best.id !== topPositive?.id) {
    insights.push({
      kind: 'best',
      label: 'Top reply rate',
      text: `${best.name} — ${best.replyRate.toFixed(2)}% on ${formatInt(best.sent)} sent.`,
    });
  }

  const highestVolume = [...campaigns].sort((a, b) => b.replies - a.replies)[0];
  if (
    highestVolume &&
    highestVolume.replies > 0 &&
    highestVolume.id !== best?.id &&
    highestVolume.id !== topPositive?.id
  ) {
    insights.push({
      kind: 'volume',
      label: 'Most replies',
      text: `${highestVolume.name} — ${highestVolume.replies} replies (${highestVolume.replyRate.toFixed(2)}% on ${formatInt(highestVolume.sent)} sent).`,
    });
  }

  const watch = campaigns.find(
    (c) => c.sent >= 50 && c.replies === 0 && c.completion < 80
  );
  if (watch) {
    insights.push({
      kind: 'watch',
      label: 'Watch',
      text: `${watch.name} has ${formatInt(watch.sent)} sent and no replies yet — ${watch.completion.toFixed(0)}% complete, likely too early to judge.`,
    });
  }

  const skipIds = new Set(
    [topPositive?.id, best?.id, highestVolume?.id, watch?.id].filter(Boolean)
  );
  const weakest = [...meaningful]
    .filter((c) => !skipIds.has(c.id) && c.replies > 0)
    .sort((a, b) => a.replyRate - b.replyRate)[0];
  if (weakest && weakest.replyRate < (best?.replyRate ?? 0)) {
    insights.push({
      kind: 'weakest',
      label: 'Worth a look',
      text: `${weakest.name} is trailing at ${weakest.replyRate.toFixed(2)}% reply on ${formatInt(weakest.sent)} sent — angle may need a refresh.`,
    });
  }

  return insights;
}

function formatInt(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}
