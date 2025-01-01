// whatsapp_automation.ts
import {
  Browser,
  BrowserContext,
  chromium,
  Page,
} from "npm:playwright@1.40.1";
import { ensureDir } from "https://deno.land/std@0.211.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.211.0/path/mod.ts";

interface WhatsAppConfig {
  userDataDir?: string;
  maxRetries?: number;
  retryDelay?: number;
  messageDelay?: number;
}

export class WhatsAppAutomation {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly config: Required<WhatsAppConfig>;

  constructor(config?: WhatsAppConfig) {
    this.config = {
      userDataDir: join(Deno.cwd(), "whatsapp-session"),
      maxRetries: 3,
      retryDelay: 1000,
      messageDelay: 1000,
      ...config,
    };
  }

  private async initializeBrowser(): Promise<void> {
    try {
      // Ensure user data directory exists
      await ensureDir(this.config.userDataDir);

      // Launch persistent context with user data directory
      this.context = await chromium.launchPersistentContext(this.config.userDataDir, {
        headless: false,
        viewport: { width: 1280, height: 800 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security"
        ]
      });

      if (!this.context) {
        throw new Error("Failed to create browser context");
      }

      // Create new page
      this.page = await this.context.newPage();

      if (!this.page) {
        throw new Error("Failed to create new page");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize browser: ${error.message}`);
      }
      throw new Error("Failed to initialize browser: Unknown error");
    }
  }

  private async waitForSelector(
    selector: string,
    timeout = 30000,
  ): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    try {
      // Try multiple selector strategies
      for (
        const alternativeSelector of this.getSelectorAlternatives(selector)
      ) {
        try {
          await this.page.waitForSelector(alternativeSelector, { timeout });
          return;
        } catch {
          continue;
        }
      }
      throw new Error(`No matching selector found for ${selector}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Timeout waiting for selector ${selector}: ${error.message}`,
        );
      }
      throw new Error(
        `Timeout waiting for selector ${selector}: Unknown error`,
      );
    }
  }

  private getSelectorAlternatives(baseSelector: string): string[] {
    const selectorMap: Record<string, string[]> = {
      "chat-list-search": [
        'div[data-testid="chat-list-search"]',
        'div[contenteditable="true"][title="Search input textbox"]',
        'div.lexical-rich-text-input > div[contenteditable="true"]',
        'div[role="textbox"][title*="Search"]',
      ],
      "chat-list-compose": [
        'div[data-testid="chat-list-compose"]',
        'span[data-testid="chat-new"]',
        'div[title="New chat"]',
        'button[aria-label="New chat"]',
      ],
      "conversation-compose-box-input": [
        'div[data-testid="conversation-compose-box-input"]',
        'div[contenteditable="true"][title="Type a message"]',
        'div[role="textbox"][title*="Type a message"]',
        'footer div[contenteditable="true"]',
      ],
      "compose-btn-send": [
        'button[data-testid="compose-btn-send"]',
        'span[data-testid="send"]',
        'button[aria-label="Send"]',
        'button[title="Send message"]',
      ],
    };

    return selectorMap[baseSelector] || [baseSelector];
  }

  async initialize(): Promise<void> {
    await this.initializeBrowser();
    if (!this.page) throw new Error("Page not initialized");

    try {
      await this.page.goto("https://web.whatsapp.com");

      // Check if QR code is present (not logged in)
      const qrCode = await this.page.$('div[data-testid="qrcode"]');
      if (qrCode) {
        console.log("\n=== WhatsApp Web Login Required ===");
        console.log("1. Open WhatsApp on your phone");
        console.log("2. Tap Menu or Settings and select WhatsApp Web");
        console.log("3. Point your phone camera at the QR code on screen");
        console.log("4. Wait for the login process to complete\n");

        // Wait for QR code to be scanned and main interface to load
        await this.waitForSelector("chat-list-search");
        console.log("Successfully logged in to WhatsApp Web!");
      } else {
        console.log("Using existing WhatsApp Web session");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize WhatsApp Web: ${error.message}`);
      }
      throw new Error("Failed to initialize WhatsApp Web: Unknown error");
    }
  }

  async sendMessage(contact: string, message: string): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    let attempts = 0;
    while (attempts < this.config.maxRetries) {
      try {
        // Click new chat button
        await this.page.click('div[data-testid="chat-list-compose"]');

        // Type contact name in search
        const searchBox = await this.page.waitForSelector(
          'div[data-testid="chat-list-search"]',
        );
        await searchBox?.fill(contact);

        // Wait for contact to appear and click
        const contactSelector =
          `span[title="${contact}"], div[title="${contact}"]`;
        try {
          await this.page.waitForSelector(contactSelector, { timeout: 5000 });
          await this.page.click(contactSelector);
        } catch (error: unknown) {
          throw new Error(`Contact "${contact}" not found`);
        }

        // Type message
        const messageBox = await this.page.waitForSelector(
          'div[data-testid="conversation-compose-box-input"]',
        );
        await messageBox?.fill(message);

        // Send message
        await this.page.click('button[data-testid="compose-btn-send"]');

        // Wait for message to be sent (check for double checkmarks)
        await this.page
          .waitForSelector('span[data-testid="msg-dblcheck"]', {
            timeout: 10000,
          })
          .catch(() => console.warn("Could not confirm message delivery"));

        console.log(`Message sent successfully to ${contact}`);
        return;
      } catch (error: unknown) {
        attempts++;
        if (error instanceof Error) {
          if (error.name === "TimeoutError") {
            console.warn(`Attempt ${attempts}: Timeout error, retrying...`);
          } else if (attempts === this.config.maxRetries) {
            throw new Error(
              `Failed to send message to ${contact} after ${attempts} attempts: ${error.message}`,
            );
          }
        }
        await this.page.waitForTimeout(this.config.retryDelay);
      }
    }
  }

  async sendBulkMessages(contacts: string[], message: string): Promise<void> {
    for (const contact of contacts) {
      try {
        await this.sendMessage(contact, message);
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.messageDelay)
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Failed to send message to ${contact}:`, error.message);
        } else {
          console.error(`Failed to send message to ${contact}: Unknown error`);
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
  }
}
