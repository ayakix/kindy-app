'use strict';

const moment = require("moment");
const momentTimezone = require('moment-timezone');
const { IncomingWebhook } = require("@slack/webhook");
const axios = require("axios");

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

      var text = null;
      var imageUrls = null;
      await page.on('requestfinished', async (request) => {
        if (request.url().indexOf('home?q%5Bkid_id_eq') == -1) {
          return;
        }
        var response = await request.response();
        try {
          let body = await response.buffer();
          let obj = JSON.parse(body);
          if (obj.success != true) {
            return;
          }

          let data = obj.data[0];
          if (data.target_date == moment().tz('Asia/Tokyo').format('YYYY/MM/DD')) {
            text = data.content;
            imageUrls = data.images.map(image => {
              return image.photo;
            });
          }
        } catch (err) {
          // console.log(err);
        }
      });

      const instance = axios.create({
        baseURL: 'https://notify-api.line.me',
        headers: {
          "Authorization": "Bearer " + process.env.LINE_NOTIFY_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        }
      })

      await page.waitForTimeout(5 * 1000);
      if (text) {
        // Slack
        const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
        await webhook.send(text + '\n' + imageUrls.join('\n'));

        // LINE
        var params = new URLSearchParams()
        params.append('message', text + '\n' + imageUrls.join('\n'))
        const res = instance.post('/api/notify', params)
        await page.waitForTimeout(1 * 1000);
        imageUrls.map(imageUrl => {
          var params = new URLSearchParams()
          params.append('message', " ")
          params.append('imageThumbnail', imageUrl)
          params.append('imageFullsize', imageUrl)
          const res = instance.post('/api/notify', params)
          page.waitForTimeout(1 * 1000);
        });
      }

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
