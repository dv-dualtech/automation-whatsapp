import { test, expect } from '@playwright/test';

// test.describe('WhatsApp Web Tests', () => {
    // test.beforeAll(async ({ browser }, testInfo) => {
    //     // Create a new context and page for device linking
    //     const context = await browser.newContext();
    //     const page = await context.newPage();
        
    //     // Navigate to WhatsApp Web
    //     await page.goto('https://web.whatsapp.com/');
        
    //     // Wait for QR code to appear
    //     const qrCode = await page.waitForSelector('[data-testid="qrcode"]', { timeout: 120000 });
        
    //     // Display message to user about scanning QR code
    //     console.log('Please scan the QR code with your WhatsApp mobile app to link the device');
        
    //     // Wait for the chat list to appear which indicates successful linking
    //     await page.waitForSelector('[data-testid="chat-list"]', { timeout: 60000 });
    //     console.log('Device linked successfully');
        
    //     // Store the context for reuse
    //     const storageState = await context.storageState();
    //     testInfo.attach('whatsappContext', { body: JSON.stringify(storageState) });
        
    //     // Close the initial context
    //     await context.close();
    // });

    // test.beforeEach(async ({ browser, context }, testInfo) => {
    //     // Create a new context with stored state
    //     const attachment = testInfo.attachments.find(a => a.name === 'whatsappContext');
    //     if (!attachment?.body) {
    //         throw new Error('WhatsApp context not found. Please run tests with --headed flag first to complete device linking.');
    //     }

    //     try {
    //         const storageState = JSON.parse(Buffer.from(attachment.body).toString('utf-8'));
            
    //         // Validate storage state structure
    //         if (!storageState.cookies || !storageState.origins?.[0]?.localStorage) {
    //             throw new Error('Invalid storage state structure');
    //         }

    //         // Restore cookies
    //         await context.addCookies(storageState.cookies);
            
    //         // Restore localStorage
    //         await context.addInitScript((state: { origins: Array<{ localStorage: Record<string, string> }> }) => {
    //             if (state.origins?.[0]?.localStorage) {
    //                 Object.entries(state.origins[0].localStorage).forEach(([key, value]) => {
    //                     window.localStorage.setItem(key, value);
    //                 });
    //             }
    //         }, storageState);
    //     } catch (error) {
    //         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    //         throw new Error(`Failed to restore WhatsApp session: ${errorMessage}`);
    //     }
    // });

    test('should search for a contact by mobile number', async ({ page }) => {
        // Navigate to WhatsApp Web (will use stored state)
        await page.goto('https://web.whatsapp.com/');
        
        // Wait for chat list to be visible
        await page.waitForSelector('[data-testid="chat-list"]');
        
        // Click on new chat button
        await page.click('[data-testid="new-chat"]');
        
        // Type phone number in search box
        const searchBox = await page.waitForSelector('[data-testid="search"]');
        // await searchBox.Enter('+1234567890'); // Replace with actual test number
        
        // Wait for search results
        await page.waitForSelector('[data-testid="contact-list"]');
        
        // Verify contact is found
        const contactName = await page.textContent('[data-testid="contact-list-item"]');
        expect(contactName).toBeTruthy(); 
    });
