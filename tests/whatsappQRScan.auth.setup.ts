import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('WhatsappWebQrScan', async ({ page }) => {
        // try opening WhatsApp Web
        await page.goto('https://web.whatsapp.com/');
        
        // Wait for QR code to appear
        await expect(page.getByLabel('Scan this QR code to link a device!')).toBeVisible();
        // const qrCode = await page.waitForSelector('[data-testid="qrcode"]', { timeout: 120000 });
        
        // Display message to user about scanning QR code
        console.log('Please scan the QR code with your WhatsApp mobile app to link the device');
        
        await page.waitForURL('https://web.whatsapp.com/');
        // Wait for the chat list to appear which indicates successful linking
        await page.waitForSelector('[data-testid="chat-list"]', { timeout: 60000 });
        console.log('Device linked successfully');
        
        // Store the context for reuse
    
    
    // End of authentication steps.
    await page.context().storageState({ path: authFile });
  });