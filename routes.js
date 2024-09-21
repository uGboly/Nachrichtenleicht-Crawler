import { createPlaywrightRouter, Dataset } from 'crawlee'

// createPlaywrightRouter() is only a helper to get better
// intellisense and typings. You can use Router.create() too.
export const router = createPlaywrightRouter()

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  const title = await page.title()
  log.info(`Title of ${request.loadedUrl} is '${title}'`)

  // Save results as JSON to ./storage/datasets/default
  await Dataset.pushData({ title, url: request.loadedUrl })

  // Extract links from the current page
  // and add them to the crawling queue.
  await enqueueLinks({
    selector: 'article.b-teaser-wide > a',
    label: 'news'
  })
})
