import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: 'https://0c567ede43f91128efdc153c4ead5b9b@o4509050092322816.ingest.us.sentry.io/4509050093895680',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
