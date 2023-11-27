import { Configuration, OpenAIApi } from 'azure-openai';
import * as dotenv from "dotenv";

dotenv.config();

const {
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_INSTANCE_NAME,
    AZURE_OPENAI_API_DEPLOYMENT_NAME,
} = process.env;

const configuration = new Configuration({
    apiKey: AZURE_OPENAI_API_KEY,
    azure: {
        apiKey: AZURE_OPENAI_API_KEY,
        endpoint: `https://${AZURE_OPENAI_API_INSTANCE_NAME}.openai.azure.com`,
        deploymentName: AZURE_OPENAI_API_DEPLOYMENT_NAME,
    },
});

const openai = new OpenAIApi(configuration);

async function createChatCompletion(messages, temperature = 0.2) {
    let result = null;
    try {
        const response = await openai.createChatCompletion({
            model: AZURE_OPENAI_API_DEPLOYMENT_NAME,
            messages: messages,
            temperature,
        });
        if (response.status === 200) {
            result = {
                usage: response.data.usage,
                data: response.data.choices[0].message?.content,
            }
        } else {
            console.log(
                `Something went wrong, code: ${response.status}, ${response.statusText}`
            );
        }
    } catch (e) {
        console.log(e.message);
    }
    return result;
}

export { createChatCompletion };
