import { Handlers } from "$fresh/server.ts";
import CrawlerService from "../../services/CrawlerService.ts";

const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL") || "";

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
      
      if (result.links.length > 0) {
        // Simplify the payload to match Apify's exact requirements
        const webhookPayload = {
          startUrls: result.links.slice(0, 5).map(url => ({
            url: url,
            userData: {
              label: "DETAIL"
            }
          }))
        };
        
        console.log("Sending payload to Make.com:", JSON.stringify(webhookPayload, null, 2));
        
        try {
          const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify(webhookPayload)
          });

          const responseText = await webhookResponse.text();
          console.log("Make.com response:", responseText);
          
        } catch (webhookError) {
          console.error("Error sending to Make.com:", webhookError);
        }
      }

      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Crawler error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};