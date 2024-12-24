import { useSignal } from "@preact/signals";
import WebCrawler from "../islands/WebCrawler.tsx";

export default function Home() {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <WebCrawler />
    </div>
  );
}

