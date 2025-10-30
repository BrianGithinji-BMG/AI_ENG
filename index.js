import OpenAI from "openai";
import dotenv from "dotenv";

console.log("API key loaded:", process.env.OPENAI_API_KEY ? "✅ yes" : "❌ no");


dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
})

const messages = [
    { 
        role: "system", 
        content: "You are a helpful general knowledge expert." 
    },

    { 
        role: "user", 
        content: "Who invented AI?" 
    }
];

const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
});
    
console.log(response);  