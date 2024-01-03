import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import OpenAI from "openai";

const Options = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSubmit = async () => {
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    try {
      setIsProcessing(true);

      await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 5,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a test.",
              },
            ],
          },
        ],
      });
      chrome.storage.sync.set(
        {
          openaiApiKey,
        },
        () => {
          setIsSaved(true);
        }
      );
    } catch (error) {
      setIsError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    chrome.storage.sync.get(["openaiApiKey"], (result) => {
      result.openaiApiKey && setOpenaiApiKey(result.openaiApiKey);
    });
  }, []);

  return (
    <>
      <div className="max-w-[640px] w-m p-6 flex flex-col gap-4 border-r h-full bg-white">
        <h1 className="text-xl font-bold">
          代替テキスト生成 for X（旧twitter）
        </h1>
        <ul className="list-disc list-outside pl-4">
          <li>
            「代替テキスト生成 for
            X」は、X上の画像に対して自動的に代替テキストを生成するChrome拡張機能です。
          </li>
          <li>
            Xの代替テキスト挿入時に生成AIを使って生成する機能を提供します。
          </li>
          <li>代替テキスト生成にはOpenAI（ChatGPT）API Keyが必要です。</li>
        </ul>
        <hr />

        <div className="flex flex-col gap-4">
          {isSaved && (
            <div role="alert" className="alert alert-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>API Keyを保存しました。</span>
              <div>
                <button
                  className="btn btn-sm"
                  onClick={() => setIsSaved(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
          {isError && (
            <div role="alert" className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                無効なAPI Keyです。API Keyが正しいかどうか確認してください。
              </span>
            </div>
          )}

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">OpenAI API Key</span>
            </div>
            <input
              type="text"
              placeholder="sk-XXXXXXXXXXXXXXXXXXXXXXXX"
              className={`input input-bordered w-full ${
                isError && "input-error"
              }`}
              value={openaiApiKey}
              disabled={isProcessing}
              onChange={(e) => {
                setOpenaiApiKey(e.target.value);
                setIsError(false);
                setIsSaved(false);
              }}
            />
            <div className="label">
              <span className="label-text-alt">
                OpenAIのAPIキーの取得については
                <a
                  className="link"
                  href="https://book.st-hakky.com/data-science/open-ai-create-api-key/"
                >
                  OpenAI API Key の取得方法 | Hakky Handbook
                </a>
                などを参考にしてください。
              </span>
            </div>
          </label>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing && <span className="loading loading-spinner"></span>}
            設定を保存
          </button>
        </div>
      </div>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
