import { readJSONSync, writeJSONSync, ensureDirSync, pathExistsSync } from 'fs-extra/esm';
import { readFileSync } from 'fs'
import { createChatCompletion } from './openai.js';
import { multiRequest } from './utils.js';

const config = readJSONSync('input/config.json');
const prompt = readFileSync('input/prompt.txt', 'utf8');
const inputData = readFileSync('input/inputData.txt', 'utf8');
const comparePrompt = readFileSync('input/comparePrompt.txt', 'utf8');
const extractJsonPrompt = readFileSync('input/extractJsonPrompt.txt', 'utf8');

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
        {
            role: 'system',
            content: prompt
        },
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

// 结果两两比较
const compare = (result1, result2) => {
    if (Array.isArray(result1) && Array.isArray(result2) && result1.length === result2.length) {
        const messages = [
            {
                role: 'system',
                content: comparePrompt
            },
            {
                role: 'user',
                content: `Here are two arrays:
                Array one: \`${JSON.stringify(result1)}\` \n
                Array two: \`${JSON.stringify(result2)}\`
                `
            },
        ];
        return createChatCompletion(messages).then(response => {
            try {
                return JSON.parse(response.data);
            } catch (err) {
                return { result: false, explain: '' }
            }
        })
    } else {
        return Promise.resolve({ result: false, explain: 'array length is not equal' })
    }
}

// 结果评估算法一，每两个之间都要作对比
const evaluate = async (list) => {
    if (list.length < 2) {
        return {}
    }
    const n = list.length
    const result = new Array(n).fill(0)
    const cache = {}

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            console.log(`compare: ${i} to ${j}`)
            const response = await compare(list[i], list[j])
            cache[`${i}_${j}`] = response
            if (response.result) {
                result[i] += 1
                result[j] += 1
            }
        }
    }
    return {
        result,
        cache,
    }
}

// 结果评估算法二，分堆的思想，一样的就不用比了
const evaluate2 = async (list) => {
    if (list.length < 2) {
        return {}
    }
    const n = list.length
    const result = new Array(n).fill(0)
    const cache = {}

    for (let i = 0; i < n; i++) {
        if (result[i]) {
            continue
        }
        let sameList = []
        for (let j = i + 1; j < n; j++) {
            if (result[j]) {
                continue
            }
            console.log(`compare: ${i} to ${j}`)
            const response = await compare(list[i], list[j])
            cache[`${i}_${j}`] = response
            if (response.result) {
                sameList.push(j)
            } else {
                console.log(response.explain)
            }
        }
        const count = sameList.length + 1
        result[i] = count
        for (let k = 0; k < count; k++) {
            result[sameList[k]] = count
        }
    }
    return {
        result,
        cache,
    }
}

// 读取某一次执行结果
const getListFromFolder = folder => {
    const list = []
    let i = 0
    while (true) {
        const file = `output/${folder}/result_${i}.json`
        if (pathExistsSync(file)) {
            list.push(readJSONSync(file))
            i++
        } else {
            break;
        }
    }
    return list
}

// 评估某一个文件夹下的结果
const evaluateFoler = async folder => {
    const list = getListFromFolder(folder)
    const evaluateResult = await evaluate2(list)
    writeJSONSync(`output/${config.outputFolder}/evaluate_result.json`, evaluateResult, { spaces: 4 })
}

const main = () => {
    multiRequest(requests).then(async result => {
        const list = result.map(item => item.data)
        ensureDirSync(`output/${config.outputFolder}`)
        list.forEach((item, index) => {
            writeJSONSync(`output/${config.outputFolder}/result_${index}.json`, item, { spaces: 4 })
        })

        await evaluateFoler(config.outputFolder)
        console.log('success')
    }).catch(error => {
        console.log(error.message)
    })
}

// main()

evaluateFoler('test')
