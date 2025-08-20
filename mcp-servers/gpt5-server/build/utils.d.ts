export declare function callGPT5(apiKey: string, input: string, options?: {
    model?: string;
    instructions?: string;
    reasoning_effort?: 'low' | 'medium' | 'high';
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    tools?: Array<{
        type: 'web_search_preview' | 'file_search' | 'function';
        [key: string]: any;
    }>;
}): Promise<{
    content: string;
    usage?: any;
}>;
export declare function callGPT5WithMessages(apiKey: string, messages: Array<{
    role: 'user' | 'developer' | 'assistant';
    content: string | Array<{
        type: 'input_text' | 'input_image' | 'input_file';
        text?: string;
        image_url?: string;
        file_id?: string;
        file_url?: string;
    }>;
}>, options?: {
    model?: string;
    instructions?: string;
    reasoning_effort?: 'low' | 'medium' | 'high';
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    tools?: Array<{
        type: 'web_search_preview' | 'file_search' | 'function';
        [key: string]: any;
    }>;
}): Promise<{
    content: string;
    usage?: any;
}>;
//# sourceMappingURL=utils.d.ts.map