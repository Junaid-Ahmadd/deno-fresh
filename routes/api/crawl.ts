import { Handlers } from "$fresh/server.ts";
import CrawlerService from "../../services/CrawlerService.ts";

export const handler: Handlers = {
  async POST(req) {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const crawler = new CrawlerService();
    try {
      const result = await crawler.startCrawling(url);
      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};
