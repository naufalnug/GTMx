/* No-JS fallback for the Cal.com inline embed.

   The embed is injected by components/useDeferredCalEmbed.js from an
   IntersectionObserver, so with JavaScript disabled every booking container is an
   empty div holding reserved height: a booking section with nothing in it, for a
   visitor and for any crawler that does not execute JS. Before this there was no
   direct cal.com link anywhere in the app.

   Rendered inside <noscript>, so it is invisible and costs nothing when JS runs. */
export const CAL_HOSTED_URL = 'https://cal.com/team/gtmx/initial-consultation-call'
export const BOOKING_EMAIL = 'hello@gtmx.run'

export default function BookingFallback() {
  return (
    <noscript>
      <p className="booking-fallback">
        Book a free 30-minute GTM audit on{' '}
        <a href={CAL_HOSTED_URL} target="_blank" rel="noopener noreferrer">
          the GTMx booking calendar
        </a>
        , or email <a href={`mailto:${BOOKING_EMAIL}`}>{BOOKING_EMAIL}</a>.
      </p>
    </noscript>
  )
}
