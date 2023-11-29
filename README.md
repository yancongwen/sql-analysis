# 数据分析实验

## 环境要求

- [Node.js](https://nodejs.org/en/) (>=16.14.0)
- [pnpm](https://pnpm.io/) (>=6.14.0)

## 开始

- 安装依赖
```bash
pnpm install
```

- 配置环境变量 `.env`
```
AZURE_OPENAI_API_KEY="<your-openai-api-key>"
AZURE_OPENAI_API_INSTANCE_NAME="<your-openai-api-instance-name>"
AZURE_OPENAI_API_DEPLOYMENT_NAME="<your-openai-api-deployment-name>"
AZURE_OPENAI_API_VERSION=""
```

- 修改配置

  - `prompt.txt` 用于从分析SQL中提取元信息的提示词
  - `extractJsonPrompt.txt` 从LLM响应中提取 json 格式的提示词
  - `comparePrompt.txt` 对比LLM提取元信息结果的提示词
  - `inputData.txt` 业务分析SQL
  -  `input/config.json`
    ```js
    {
        "times": 1, // 重复请求 OpenAI 的次数
        "promptFile": "prompt" // 提示词文件名，不需要加后缀
        "outputFolder": "" // 输出目录，选填，省略后取提示词文件的名称
    }
    ```

- 执行
```bash
npm start
```

- 仅进行结果评估
```bash
npm run evaluate
```
