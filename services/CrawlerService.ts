import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export default class CrawlerService {
  private visitedUrls = new Set<string>();
  private queue: string[] = [];
  private processing = new Set<string>();
  private baseUrl = "";
  private domain = "";
  private maxConcurrent = 5;
  private activeRequests = 0;
  private allLinks: string[] = []; // Add this to store all links

  private sendUpdate(type: "link" | "error" | "info", data: unknown) {
    console.log({ type, data });
    if (type === "link") {
      this.allLinks.push(data as string);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url, this.baseUrl);
      if (parsedUrl.pathname.match(/\.(jpg|jpeg|png|gif|css|js|ico|svg|woff|woff2|ttf|eot|pdf|zip|rar|exe|mp[34]|avi|mkv)$/i)) {
        return false;
      }
      return parsedUrl.hostname === this.domain;
    } catch {
      return false;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url, this.baseUrl);
      parsedUrl.hash = ""; // Remove fragments
      parsedUrl.search = ""; // Remove query parameters
      if (!parsedUrl.pathname.includes(".")) {
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/?$/, "/");
      }
      return parsedUrl.href;
    } catch {
      return "";
    }
  }

  private async processUrl(url: string) {
    if (this.processing.has(url)) return;
    this.processing.add(url);
    this.activeRequests++;

    try {
      this.sendUpdate("info", `Crawling: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const links = await this.extractLinks(html, url);

      for (const link of links) {
        const normalizedLink = this.normalizeUrl(link);
        if (normalizedLink && !this.visitedUrls.has(normalizedLink) && this.isValidUrl(normalizedLink)) {
          this.visitedUrls.add(normalizedLink);
          this.queue.push(normalizedLink);
          this.sendUpdate("link", normalizedLink);
        }
      }
    } catch (error) {
      this.sendUpdate("error", `Error processing ${url}: ${error.message}`);
    } finally {
      this.processing.delete(url);
      this.activeRequests--;
      this.processQueue();
    }
  }

  private async extractLinks(html: string, baseUrl: string): Promise<string[]> {
    const links: string[] = [];
    const document = new DOMParser().parseFromString(html, "text/html");

    if (document) {
      const anchorTags = document.querySelectorAll("a");
      for (const anchor of anchorTags) {
        const href = anchor.getAttribute("href");
        if (href) {
          links.push(new URL(href, baseUrl).href); // Normalize relative links
        }
      }
    }
    return links;
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const url = this.queue.shift();
      if (url) {
        this.processUrl(url);
      }
    }

    if (this.queue.length === 0 && this.activeRequests === 0) {
      this.sendUpdate("info", "Crawling completed");
    }
  }

  public async startCrawling(url: string): Promise<{ links: string[] }> {
    return new Promise((resolve, reject) => {
      try {
        const parsedUrl = new URL(url);
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
        this.domain = parsedUrl.hostname;

        this.visitedUrls.clear();
        this.queue = [];
        this.processing.clear();
        this.activeRequests = 0;
        this.allLinks = []; // Reset links array

        this.visitedUrls.add(url);
        this.queue.push(url);
        
        // Modified processQueue method
        const originalProcessQueue = this.processQueue.bind(this);
        this.processQueue = async () => {
          while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
            const nextUrl = this.queue.shift();
            if (nextUrl) {
              await this.processUrl(nextUrl);
            }
          }

          if (this.queue.length === 0 && this.activeRequests === 0) {
            this.sendUpdate("info", "Crawling completed");
            resolve({ links: this.allLinks });
          }
        };

        this.processQueue();
      } catch (error) {
        this.sendUpdate("error", `Invalid URL: ${error.message}`);
        reject(error);
      }
    });
  }
}

