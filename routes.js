import { createPlaywrightRouter, Dataset } from 'crawlee'

export const router = createPlaywrightRouter()

router.addHandler('news', async ({ request, page, log }) => {
  const title = (
    await page
      .locator('h1.b-article-header-main span.headline-title')
      .textContent()
  ).trim()

  const description = await page
    .locator('p.article-header-description')
    .textContent()

  const detail = (
    await page
      .locator('.article-details-text.u-space-bottom-xl')
      .allTextContents()
  ).join('\n')

  const fullText = [title, description, detail].join('\n')

  const audioScript = fullText
    .match(/[^.!?,:,]+[.!?,:]+/g)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')

  const audioUrl = await page
    .locator('a[alt="Audio herunterladen"]')
    .getAttribute('href')

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

  //   log.info(`Article in ${request.loadedUrl} is '${fullText}'`)

  // Save results as JSON to ./storage/datasets/default
  const result = {
    title,
    url: request.loadedUrl,
    description,
    detail,
    wordsBook,
    fullText,
    audioScript,
    audioUrl
  }
  await Dataset.pushData(result)
})

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
  for (let i = 0; i < 10; i++) {
    const newsCount = await page.locator('article.b-teaser-wide').count()
    log.info('There are ' + newsCount + ' news items')
    await page.locator('button.js-load-more-button').click()
    await page.waitForSelector(
      `article.b-teaser-wide:nth-of-type(${newsCount + 2})`
    )
  }

  // Extract links from the current page
  // and add them to the crawling queue.
  await enqueueLinks({
    selector: '.js-load-more-content-wrapper article > a',
    label: 'news'
  })
})
