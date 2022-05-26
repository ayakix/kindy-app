'use strict';

const getBrowser = async () => {
    let browser = null;
    if (process.env.IS_LOCAL) {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({ headless: false });
    } else {
        const chromium = require('chrome-aws-lambda');
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true
        });
    }
    return browser;
};

const login = async (page) => {
    await page.goto('https://guardian.kindy-app.jp/sign_in', { waitUntil: 'networkidle0'} );
    await page.waitForTimeout(1 * 1000);

    await page.type('input[name="email"]', process.env.ACCOUNT_EMAIL);
    await page.type('input[name="password"]', process.env.ACCOUNT_PASSWORD);

    await Promise.all([
      page.click('button[type=submit]'),
      page.waitForNavigation({waitUntil: 'networkidle0'})
    ]);
};

module.exports.crawl = async (event, context, callback) => {
  let browser = await getBrowser();
  let page = null;
  try {
      page = await browser.newPage();
      await login(page);
      
      console.log(page.url());
      return callback(null, JSON.stringify({ result: 'OK' }));
  } catch (err) {
      console.error(err);
      return callback(null, JSON.stringify({ result: 'NG' }));
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.disconnect();
      await browser.close();
    }
  }
};
