import OpenAIApi from "openai";
import Configuration from "openai";
import { createReadStream } from "fs";
import { openaiKey } from "./config.js";
import { errToLogFile } from "./errwriter.js";

class openAI {
  roles = {
    ASSISTANT: "assistant",
    USER: "user",
    SYSTEM: "system",
  };
  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }
  async chat_gpt(messages) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
      });
      return response.choices[0].message.content;
    } catch (e) {
      await errToLogFile(`error while gpt chat, ERROR:${e}, FILE: openai.js `);
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: createReadStream(filepath),
        model: "whisper-1",
      });
      return response.text;
    } catch (e) {
      await errToLogFile(
        `error while transcription, ERROR:${e}, FILE: openai.js`,
      );
    }
  }

  async dalle(promt) {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: String(promt),
        n: 1,
        size: "1024x1024",
      });
      return response.data[0].url;
    } catch (e) {
      await errToLogFile(
        `error in generating img, ERROR: ${e}, FILE: openai.js`,
      );
    }
  }

  async gptvision(image_url, text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: text },
              {
                type: "image_url",
                image_url: {
                  url: image_url,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });
      return response.choices[0];
    } catch (e) {
      await errToLogFile(
        `error in analyzing img, ERROR: ${e}, FILE: openai.js`,
      );
    }
  }


}

export const openai = new openAI(openaiKey);
