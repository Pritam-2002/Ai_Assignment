import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function getHeaderMapping(
    headers: string[],
    sampleRows: any[] // or more specific: string[][]
): Promise<Record<string, string>> {
    // Create the prompt template - MORE SPECIFIC FOR FREE MODELS
    const prompt = ChatPromptTemplate.fromTemplate(`
    You are a data cleaner. Your task is to fix misspelled column headers.
    
    Headers: {headers}
    Sample Data: {samples}
    
    IMPORTANT: Return ONLY a JSON object. No explanations, no code blocks, no extra text.
    
    Rules:
    1. If headers look correct: return {{}}
    2. If headers need fixing: return {{"wrong_header": "correct_header"}}
    3. Only return the JSON object, nothing else
    
    Examples:
    - {{"Nme": "name", "Agge": "age"}}
    - {{}}
  `);

    // Initialize the model with OpenRouter configuration (FREE MODEL)
    const model = new ChatOpenAI({
        modelName: "meta-llama/llama-3.1-8b-instruct:free", // FREE MODEL
        temperature: 0,
        openAIApiKey: process.env.OPENROUTER_API_KEY!, // Use environment variable
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
        },
    });

    // Create output parser
    const outputParser = new StringOutputParser();

    // Create the chain using LCEL syntax
    const chain = prompt.pipe(model).pipe(outputParser);

    try {
        // Execute the chain
        const result = await chain.invoke({
            headers: JSON.stringify(headers),
            samples: JSON.stringify(sampleRows.slice(0, 5)), // Limit sample size for efficiency
        });

        console.log("Raw AI response:", result); // Debug log

        // Clean the response - remove markdown, code blocks, extra text
        let cleanedResult = result.trim();

        // Remove markdown code blocks
        cleanedResult = cleanedResult.replace(/```json\s*/gi, '');
        cleanedResult = cleanedResult.replace(/```python\s*/gi, '');
        cleanedResult = cleanedResult.replace(/```\s*/g, '');

        // Extract JSON from the response
        const jsonMatch = cleanedResult.match(/\{[^}]*\}/s);
        if (jsonMatch) {
            cleanedResult = jsonMatch[0];
        }

        // Handle case where model returns explanation text
        const lines = cleanedResult.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.includes('}')) {
                cleanedResult = trimmed;
                break;
            }
        }

        // Try to parse JSON
        try {
            return JSON.parse(cleanedResult);
        } catch (parseError) {
            console.log("Failed to parse:", cleanedResult);
            // If still fails, return empty object
            return {};
        }

    } catch (error) {
        console.error("Error in header mapping:", error);
        // Fallback: return empty mapping if parsing fails
        return {};
    }
}

