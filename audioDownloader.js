import fs from 'fs'
import path from 'path'
import axios from 'axios'
import fse from 'fs-extra'

const inputDir = './storage/datasets/default'
const outputDir = './output'

const maxRetries = 3
const retryDelay = 2000

fse.ensureDirSync(outputDir)

fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('Unable to read the input dir:', err)
    return
  }

  files.forEach(file => {
    const filePath = path.join(inputDir, file)

    if (path.extname(file) === '.json') {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Unable to read file ${file}:`, err)
          return
        }

        try {
          const jsonData = JSON.parse(data)

          const title = jsonData.title.replace(/\s+/g, '_').replace(/:/g, '')
          const audioScript = jsonData.audioScript
          const audioUrl = jsonData.audioUrl

          const subFolderPath = path.join(
            outputDir,
            `${file.slice(6, 9)}_${title}`
          )
          fse.ensureDirSync(subFolderPath)

          const txtFilePath = path.join(subFolderPath, `${title}.txt`)
          fs.writeFileSync(txtFilePath, audioScript, 'utf8')

          const audioFilePath = path.join(
            subFolderPath,
            path.basename(audioUrl)
          )
          downloadAudioWithRetries(audioUrl, audioFilePath, maxRetries)
        } catch (err) {
          console.error(`Fail to parse ${file}:`, err)
        }
      })
    }
  })
})

async function downloadAudioWithRetries (url, filePath, retries) {
  try {
    await downloadAudio(url, filePath)
  } catch (err) {
    if (retries > 0) {
      console.warn(
        `Download failed, retrying... Remaining retries: ${retries}, Error: ${err.message}`
      )

      setTimeout(() => {
        downloadAudioWithRetries(url, filePath, retries - 1)
      }, retryDelay)
    } else {
      console.error(
        `Failed to download audio file: ${url}, Error: ${err.message}`
      )
    }
  }
}

async function downloadAudio (url, filePath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000
    })

    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  } catch (err) {
    throw new Error(`Failed to download audio file ${url}: ${err.message}`)
  }
}
