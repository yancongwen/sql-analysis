import { readJSONSync, writeJSONSync, ensureDirSync, emptyDirSync } from 'fs-extra/esm';
import { readFileSync } from 'fs'
import { createChatCompletion } from './openai.js';
import { multiRequest, extractMessages } from './utils.js';
import { evaluateFoler } from './evaluate.js';

const config = readJSONSync('input/config.json');
const promptContent = readFileSync(`input/${config.promptFile}.txt`, 'utf8');
const inputData = readFileSync('input/inputData.txt', 'utf8');
const extractJsonPrompt = readFileSync('input/extractJsonPrompt.txt', 'utf8');

const outputFolder = config.outputFolder || config.promptFile;

// 提取JSON
const extractJSON = content => {
    console.log('Extracting JSON...');
    const messages = [
        {
            role: 'system',
            content: extractJsonPrompt
        },
        {
            role: 'user',
            content: content
        },
    ];
    return createChatCompletion(messages).then(response => {
        try {
            response.data = JSON.parse(response.data);
        } catch (err) {
            response.data = []
        }
        return response.data;
    })
}

const requests = new Array(config.times).fill(null).map(() => {
    const messages = [
        ...extractMessages(promptContent),
        {
            role: 'user',
            content: inputData
        },
    ];
    return () => {
        return createChatCompletion(messages).then(async response => {
            try {
                const data = JSON.parse(response.data)
                response.data = data
            } catch (err) {
                response.data = await extractJSON(response.data)
            }
            return response
        })
    }
})

const run = () => {
    multiRequest(requests).then(async result => {
        const list = result.map(item => item.data)
        ensureDirSync(`output/${outputFolder}`)
        emptyDirSync(`output/${outputFolder}`)
        list.forEach((item, index) => {
            writeJSONSync(`output/${outputFolder}/result_${index}.json`, item, { spaces: 4 })
        })

        await evaluateFoler(outputFolder)
        console.log('success')
    }).catch(error => {
        console.log(error.message)
    })
}

run();
