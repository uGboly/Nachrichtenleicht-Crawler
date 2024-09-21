import fs from 'fs';
import path from 'path';
import axios from 'axios';
import fse from 'fs-extra';

const inputDir = './storage/datasets/default';
const outputDir = './output';

fse.ensureDirSync(outputDir);

fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Unable to read the input dir:', err);
        return;
    }

    files.forEach(file => {
        const filePath = path.join(inputDir, file);

        if (path.extname(file) === '.json') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Unable to read file ${file}:`, err);
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);

                    const title = jsonData.title;
                    const fullText = jsonData.fullText;
                    const audioUrl = jsonData.audioUrl;

                    const subFolderPath = path.join(outputDir, title);
                    fse.ensureDirSync(subFolderPath);

                    const txtFilePath = path.join(subFolderPath, `${title}.txt`);
                    fs.writeFileSync(txtFilePath, fullText, 'utf8');

                    const audioFilePath = path.join(subFolderPath, path.basename(audioUrl));
                    downloadAudio(audioUrl, audioFilePath);

                } catch (err) {
                    console.error(`Fail to parse ${file}:`, err);
                }
            });
        }
    });
});

async function downloadAudio(url, filePath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log(`Audio file downloaded: ${filePath}`);
        });

        writer.on('error', (err) => {
            console.error(`Fail to downloaded: ${url}`, err);
        });
    } catch (err) {
        console.error(`Unable to downloaded ${url}:`, err);
    }
}
