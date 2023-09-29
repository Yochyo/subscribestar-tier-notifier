import puppeteer, { type ElementHandle } from 'puppeteer';
import { configDotenv } from 'dotenv';

type Tier = {
  name: string;
  price: number;
  hasReachedLimit: boolean;
};

void (async () => {
  configDotenv();
  const watch = JSON.parse(process.env.WATCH_TIERS!);
  let areOpen: string[] = [];

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  console.log('open browser');
  while (true) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto(process.env.URL!);
    console.log(`[${new Date()}]: open page ${process.env.URL!}`);

    const tiers = await Promise.all((await page.$$('.tier')).map(tier => Tier(tier)));
    console.log('tiers', JSON.stringify(tiers));
    // all tiers that are watched and haven't reached the limit
    const relevantTiers = tiers.filter(tier => watch.includes(tier.name)).filter(tier => !tier.hasReachedLimit);
    if (relevantTiers.length > 0) {
      // filter relevant tiers so email doesn't get sent every n minutes while the tier is open
      const newlyOpened = relevantTiers.filter(tier => !areOpen.includes(tier.name));
      if (newlyOpened.length > 0) {
        await notify(newlyOpened);
      }

      areOpen = relevantTiers.map(tier => tier.name);
    }
    await page.close();
    await randomsleep();
  }
})();

const Tier = async (element: ElementHandle): Promise<Tier> => {
  const getPrice = async (): Promise<number> => {
    const res = await element.$eval('.tiers-settings_item-cost', e => e.childNodes[0].nodeValue);
    const price = res?.match(/\d+\.?\d*/)?.[0];
    if (!price) throw new Error(`Couldn't find price of tier ${await getName()}\n${element.toString()}`);
    return +price;
  };

  const getName = async (): Promise<string> => {
    return (await element.$eval('.tiers-settings_item-title', e => e.innerHTML)).trim();
  };

  const hasReachedLimit = async (): Promise<boolean> => {
    return (await element.$$('.for-tier-unlock.is-grey')).length == 1;
  };

  return { price: await getPrice(), name: await getName(), hasReachedLimit: await hasReachedLimit() };
};

async function randomsleep(): Promise<unknown> {
  const min = +process.env.SLEEP_MIN!;
  const max = +process.env.SLEEP_MAX!;
  const rand = Math.floor(min + (max - min) * Math.random());
  console.log(`Sleep ${rand / 1000} seconds`);
  return await new Promise(resolve => setTimeout(resolve, rand));
}

async function notify(tiers: Tier[]) {
  const res = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.API_KEY,
      to: [`${process.env.EMAIL_TO} <${process.env.EMAIL_TO}>`],
      sender: `Subscribe-Star notifier <${process.env.EMAIL_FROM}>`,
      subject: `Subscribestar tier open ${JSON.stringify(tiers.map(tier => tier.name))}`,
      text_body: `The following tiers are open: \n ${JSON.stringify(tiers)}`,
    }),
  });
  console.log(await res.text());
}
