import OpenAI from "openai";

class ContentScript {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: apiKey,
    });
  }

  public async resOpenai(imageUrl: string) {
    const stream = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この画像を解析して、代替テキストとして出力してください。",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      stream: true,
    });

    const textarea = document.querySelector(
      "[data-testid='altTextInput']"
    ) as HTMLTextAreaElement;

    for await (const chunk of stream) {
      textarea.value += chunk.choices[0]?.delta?.content || "";
    }
  }

  public async convertBlobUrlToBase64(blobUrl: string) {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx!.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      };
      img.onerror = (e) => {
        reject(e);
      };
      img.src = blobUrl;
    });
  }

  public insertButton(targetElement: Element) {
    const button = document.createElement("button");
    button.classList.add("my-button");
    button.style.marginTop = "8px";
    button.style.marginBottom = "8px";
    button.style.border = "1px solid black";
    button.style.borderRadius = "99em";
    button.style.background = "white";
    button.style.padding = "4px";
    button.style.cursor = "pointer";

    button.textContent = "代替テキストを生成🪄";

    button.addEventListener("click", async () => {
      const imgElement = document.querySelector('img[src^="blob:"]');
      const blobUrl = imgElement?.getAttribute("src");

      button.disabled = true;

      if (blobUrl) {
        try {
          const base64Image: string = await this.convertBlobUrlToBase64(
            blobUrl
          );
          const label = document.querySelector(
            'label[aria-label="代替テキスト"]'
          );
          console.log(label);
          if (label) {
            // ラベルが見つかったらフォーカスを当てる
            (label as HTMLInputElement).focus();
          } else {
            console.log("指定されたlabel要素が見つかりませんでした。");
          }

          await this.resOpenai(base64Image);
        } catch (error) {
          console.error("画像の変換に失敗しました:", error);
        } finally {
          button.disabled = false;
        }
      }
    });

    targetElement.parentNode?.insertBefore(button, targetElement.nextSibling);
  }

  public handleButtonClick(event: Event) {
    // クリックされた要素とその親要素を取得
    const target = event.target as Element;
    const parent = target.closest('a[aria-label="画像の説明を編集"]');

    // クリックされた要素または親要素が条件に合致する<a>タグであるかをチェック
    if (parent) {
      setTimeout(() => {
        const targetElement = document.querySelector(
          'label[aria-label="代替テキスト"]'
        );
        const targetButton = document.querySelector("button.my-button");

        if (targetElement && !targetButton) {
          this.insertButton(targetElement);
        } else {
          console.log("目的の要素が見つかりませんでした。");
        }
      }, 300);
    }
  }

  public initialize() {
    document.addEventListener("click", this.handleButtonClick.bind(this));
  }
}

chrome.storage.sync.get(["openaiApiKey"], function (result) {
  const apiKey = result.openaiApiKey;
  const contentScript = new ContentScript(apiKey);
  contentScript.initialize();
});
