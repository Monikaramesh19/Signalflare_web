import { expect } from '@wdio/globals';

describe('SignalFlare Mobile E2E - Functional', () => {
    
    it('TC-001: Should load the application correctly on mobile browser', async () => {
        await browser.url('/');
        const pageTitle = await browser.getTitle();
        expect(pageTitle).toContain('SignalFlare');
    });

    it('TC-002: Should display login page when unauthenticated', async () => {
        await browser.url('/login');
        const emailInput = await $('input[type="email"]');
        const passwordInput = await $('input[type="password"]');
        
        await expect(emailInput).toBeDisplayed();
        await expect(passwordInput).toBeDisplayed();
    });

    it('TC-003: Should authenticate user with valid credentials', async () => {
        const emailInput = await $('input[type="email"]');
        const passwordInput = await $('input[type="password"]');
        const submitBtn = await $('button[type="submit"]');

        await emailInput.setValue('test@signalflare.org');
        await passwordInput.setValue('Password123!');
        await submitBtn.click();

        // Assuming it redirects to dashboard
        await browser.waitUntil(
            async () => (await browser.getUrl()).includes('/dashboard'),
            { timeout: 5000, timeoutMsg: 'Expected to redirect to dashboard after login' }
        );
    });

    it('TC-004: Should trigger SOS Emergency successfully', async () => {
        // Find and click the SOS button on the dashboard
        const sosButton = await $('.sos-trigger-btn, button*=SOS');
        await expect(sosButton).toBeDisplayed();
        
        await sosButton.click();
        
        // Verify emergency state activated
        const alertBanner = await $('.emergency-active-banner');
        await expect(alertBanner).toBeDisplayed();
    });
});
