import OpenAI from "openai";

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name == "openaiStream");
  port.onMessage.addListener(function (msg) {
    if (msg.message === "fetchAltText") {
      chrome.storage.sync.get(["openaiApiKey"], function (result) {
        const apiKey = result.openaiApiKey;

        if (apiKey) {
          const openai = new OpenAI({ apiKey: apiKey });
          const stream = openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: msg.promptText,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: msg.imageUrl,
                    },
                  },
                ],
              },
            ],
            stream: true,
          });

          stream
            .then(async (responseStream) => {
              for await (const chunk of responseStream) {
                const textChunk = chunk.choices[0]?.delta?.content || "";
                port.postMessage({ text: textChunk });
              }
            })
            .catch((error) => {
              console.error("Error with OpenAI API:", error);
              port.postMessage({
                error: "Failed to fetch response from OpenAI API.",
              });
            })
            .finally(() => {
              port.postMessage({ done: true });
            });
        } else {
          console.error("OpenAI API Keyが設定されていません。");
          port.postMessage({ error: "API Key is not set." });
        }
      });
    }
  });
});
