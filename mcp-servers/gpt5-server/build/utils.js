import fetch from 'node-fetch';
export async function callGPT5(apiKey, input, options = {}) {
    const requestBody = {
        model: options.model || 'gpt-5',
        input,
        ...(options.instructions && { instructions: options.instructions }),
        ...(options.reasoning_effort && { reasoning: { effort: options.reasoning_effort } }),
        ...(options.tools && { tools: options.tools }),
        stream: false
    };
    console.error('Making GPT-5 API request:', JSON.stringify(requestBody, null, 2));
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPT-5 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.error('GPT-5 API response:', JSON.stringify(data, null, 2));
    return {
        content: data.output_text || (data.output?.[0]?.content?.[0]?.text) || JSON.stringify(data, null, 2),
        usage: data.usage
    };
}
export async function callGPT5WithMessages(apiKey, messages, options = {}) {
    const requestBody = {
        model: options.model || 'gpt-5',
        input: messages,
        ...(options.instructions && { instructions: options.instructions }),
        ...(options.reasoning_effort && { reasoning: { effort: options.reasoning_effort } }),
        ...(options.tools && { tools: options.tools }),
        stream: false
    };
    console.error('Making GPT-5 API request with messages:', JSON.stringify(requestBody, null, 2));
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPT-5 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.error('GPT-5 API response:', JSON.stringify(data, null, 2));
    return {
        content: data.output_text || (data.output?.[0]?.content?.[0]?.text) || JSON.stringify(data, null, 2),
        usage: data.usage
    };
}
//# sourceMappingURL=utils.js.map