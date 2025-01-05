import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('WhatsappWebQrScan', {
}, async ({ page }) => {
    // Open WhatsApp Web
    await page.goto('https://web.whatsapp.com/');
    
    // Wait for QR code to appear with longer timeout
    await expect(page.getByLabel('Scan this QR code to link a device!')).toBeVisible({ timeout: 30000 });
    
    console.log('Please scan the QR code with your WhatsApp mobile app to link the device');
    
    // Wait for successful login
    // Additional verification that we're logged in
    await expect(page.locator('#side')).toBeVisible({ timeout: 120000 });
    // This will wait for the chat list to appear which indicates successful login
    // await expect(page.locator('[data-testid="chat-list"]')).toBeVisible({ timeout: 120000 });
    
    console.log('Device linked successfully');

    // Store authentication state
    await page.context().storageState({ path: authFile });
});
