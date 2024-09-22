import { PlaywrightCrawler } from 'crawlee'
import { router } from './routes.js'

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
  requestHandler: router,
  maxRequestRetries: 1,
  maxRequestsPerCrawl: 100000
})

// Add first URL to the queue and start the crawl.
await crawler.run([
  'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.html',
  'https://www.nachrichtenleicht.de/nachrichtenleicht-kultur-index-100.html',
  'https://www.nachrichtenleicht.de/nachrichtenleicht-vermischtes-100.html'
  // 'https://www.nachrichtenleicht.de/nachrichtenleicht-sport-100.html'
])
