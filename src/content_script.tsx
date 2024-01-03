class ContentScript {
  constructor() {
    this.appendStyles();
    document.addEventListener("click", this.handleButtonClick.bind(this));
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

  public appendStyles() {
    const css = `
    .loader,
    .loader:after {
      border-radius: 50%;
      width: 1em;
      height: 1em;
    }
    .loader {
      margin: 0 auto;
      font-size: 10px;
      position: relative;
      text-indent: -9999em;
      border-top: 0.2em solid rgba(0,0,0, 0.2);
      border-right: 0.2em solid rgba(0,0,0, 0.2);
      border-bottom: 0.2em solid rgba(0,0,0, 0.2);
      border-left: 0.2em solid #000000;
      -webkit-transform: translateZ(0);
      -ms-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-animation: load8 1.1s infinite linear;
      animation: load8 1.1s infinite linear;
      position: absolute;
      right: 6px;
      bottom: 6px;
      display: none;
    }
    @-webkit-keyframes load8 {
      0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
      }
    }
    @keyframes load8 {
      0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
      }
    }
      .alt-generator-button {
        margin-top: 8px;
        margin-bottom: 8px;
        border: 1px solid black;
        border-radius: 99em;
        background: white;
        padding: 6px;
        cursor: pointer;
      }
    `;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  public insertButton(targetElement: Element) {
    const button = document.createElement("button");
    button.className = "alt-generator-button";
    button.textContent = "代替テキストを生成🪄";

    const loader = document.createElement("div");
    loader.className = "loader";

    targetElement.parentNode?.insertBefore(button, targetElement.nextSibling);
    targetElement.appendChild(loader);

    button.addEventListener("click", async () => {
      const imgElement = document.querySelector('img[src^="blob:"]');
      const blobUrl = imgElement?.getAttribute("src");
      const textarea = document.querySelector(
        "[data-testid='altTextInput']"
      ) as HTMLTextAreaElement;

      textarea.value = "";
      button.disabled = true;
      button.textContent = "生成中⏳";
      this.toggleLoader(true);

      if (blobUrl) {
        try {
          const base64Image: string = await this.convertBlobUrlToBase64(
            blobUrl
          );
          const promptText =
            "説明：画像の主要な要素とアクションを簡潔に記述し、色、雰囲気、および関連する詳細を含めてください。テキストは短く、要点を押さえたものにしてください。";

          // ポートを介してbackground.jsにメッセージを送信し、レスポンスを待機
          const port = chrome.runtime.connect({ name: "openaiStream" });

          port.postMessage({
            message: "fetchAltText",
            imageUrl: base64Image,
            promptText: promptText,
          });

          port.onMessage.addListener((response) => {
            this.toggleLoader(false);
            if (response.error) {
              console.error(response.error);
            } else {
              if (response.done) {
                button.disabled = false;
                button.textContent = "代替テキストを生成🪄";
              } else {
                // ストリーミングレスポンスを受け取る
                // 逐次更新されるテキストをtextareaに表示
                response.text && (textarea.value += response.text);
              }
            }
          });
        } catch (error) {
          console.error("画像の変換に失敗しました:", error);
        }
      }
    });
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
      }, 200);
    }
  }

  // ローダーの表示/非表示を切り替える関数
  public toggleLoader(display: boolean) {
    const loader = document.querySelector(".loader");
    if (loader) {
      const loader = document.querySelector(".loader") as HTMLElement;
      loader.style.display = display ? "block" : "none";
    }
  }
}

new ContentScript();
