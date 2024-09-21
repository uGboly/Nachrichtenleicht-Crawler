import { createPlaywrightRouter, Dataset } from 'crawlee'

export const router = createPlaywrightRouter()

router.addHandler('news', async ({ request, page, enqueueLinks, log }) => {
  const title = await page
    .locator('h1.b-article-header-main span.headline-title')
    .textContent()

  const description = await page
    .locator('p.article-header-description')
    .textContent()

  const detail = (
    await page
      .locator('.article-details-text.u-space-bottom-xl')
      .allTextContents()
  ).join('\n')

  const fullText = [title, description, detail].join('\n')

  const wordsBookList = await page.locator('ul.b-list-teaser-word li').all()
  const words = wordsBookList.map(async item => {
    const wordTitle = await item.locator('.teaser-word-title').textContent()
    const wordDescription = await item
      .locator('.teaser-word-description')
      .textContent()

    return [wordTitle, wordDescription]
  })

  const wordsBook = (await Promise.allSettled(words)).map(result => {
    if (result.status === 'fulfilled') return result.value
  })

  log.info(`Article in ${request.loadedUrl} is '${fullText}'`)

  // Save results as JSON to ./storage/datasets/default
  const result = {
    title,
    url: request.loadedUrl,
    description,
    detail,
    wordsBook,
    fullText
  }
  await Dataset.pushData(result)

  // Extract links from the current page
  // and add them to the crawling queue.
  await enqueueLinks({
    selector: 'article.b-teaser-wide > a',
    label: 'news'
  })
})

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  // Extract links from the current page
  // and add them to the crawling queue.
  await enqueueLinks({
    selector: 'article.b-teaser-wide > a',
    label: 'news'
  })
})
