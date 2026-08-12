import Script from 'next/script';

const GA_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-SMLX7BQ8SN').trim();

/** Google Analytics 4 (gtag.js) — loads on every page via root layout. */
export function GoogleAnalytics() {
  if (!GA_ID || GA_ID === 'G-XXXXXXXX') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
