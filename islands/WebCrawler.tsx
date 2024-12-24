import { useState } from "preact/hooks";

export default function WebCrawler() {
  const [url, setUrl] = useState("");
  const [crawledLinks, setCrawledLinks] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitUrl() {
    if (!url) return;

    setIsProcessing(true);
    setError(null);
    setCrawledLinks([]);

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Crawling failed");
      }

      const data = await response.json();
      if (data.links) {
        setCrawledLinks(data.links);
      }
    } catch (error) {
      setError(error.message);
      console.error("Error during crawling:", error);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main class="container mx-auto p-4 bg-white shadow rounded-lg">
      <div class="text-center mb-6">
        <h1 class="text-4xl font-bold text-blue-600">Web Crawler</h1>
        <p class="text-gray-600">Discover links on a website effortlessly.</p>
      </div>

      <div class="bg-blue-500 text-white p-4 rounded-lg shadow">
        <div class="flex gap-4 items-center">
          <input
            type="text"
            value={url}
            onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
            placeholder="Enter website URL (e.g., https://example.com)"
            class="flex-1 p-2 rounded-lg shadow-inner text-black"
            disabled={isProcessing}
          />
          <button
            onClick={submitUrl}
            class={`p-2 bg-white text-blue-500 font-bold rounded-lg ${
              !url || isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
            }`}
            disabled={!url || isProcessing}
          >
            {isProcessing ? "Processing..." : "🚀 Start Crawling"}
          </button>
        </div>
      </div>

      {error && (
        <div class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {crawledLinks.length > 0 && (
        <div class="mt-4 bg-gray-100 p-4 rounded-lg shadow">
          <h2 class="text-2xl font-bold mb-4">Discovered Links ({crawledLinks.length})</h2>
          <ul class="space-y-2">
            {crawledLinks.map((link) => (
              <li key={link} class="flex justify-between items-center border-b pb-2">
                <span class="text-blue-600">{link}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}