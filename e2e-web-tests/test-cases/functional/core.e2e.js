const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('SignalFlare Web E2E - Functional', function () {
    this.timeout(30000); // 30 second timeout for Selenium browser ops
    let driver;

    before(async function () {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function () {
        if (driver) await driver.quit();
    });

    it('TC-W-001: Should load the web application and verify title', async function () {
        await driver.get('http://localhost:5173');
        const title = await driver.getTitle();
        expect(title).to.include('SignalFlare');
    });

    it('TC-W-002: Should navigate to login page on unauthenticated access', async function () {
        await driver.get('http://localhost:5173/login');
        const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 5000);
        const isDisplayed = await emailInput.isDisplayed();
        expect(isDisplayed).to.be.true;
    });
});
