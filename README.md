# gold-price-Chart

Live site: https://manoselva.github.io

| Page | What it shows | Data |
|---|---|---|
| [`index.html`](https://manoselva.github.io/) | Chennai 22K and 24K gold rate today (per gram, 8 g, 10 g); gold rate history by day, month and year; live world gold and silver prices (USD per ounce) and their plain rupee value; gold price chart. | [livechennai.com](https://www.livechennai.com/gold_rate_history.asp) Chennai rates (copied by a GitHub Action); [gold-api.com](https://gold-api.com) live spot and USD→INR; [ExchangeRate-API](https://www.exchangerate-api.com) backup rate; [exchange-api](https://github.com/fawazahmed0/exchange-api) daily reference for the change figures; [BullionVault](https://www.bullionvault.com) chart |
| [`currency.html`](https://manoselva.github.io/currency.html) | Currency converter for 160+ currencies. Live rates every 30 s where available, daily rates for the rest. | gold-api.com (live), ExchangeRate-API (daily), exchange-api (backup) |

## Chennai rates

livechennai.com does not allow browser requests (CORS), so
[`.github/workflows/gold-history.yml`](.github/workflows/gold-history.yml) runs
[`scripts/update-gold-history.mjs`](scripts/update-gold-history.mjs) every 30 minutes in Indian
daytime. It reads this month and last month and commits `data/chennai-gold.json`
(`[date, 24K, 22K]` in INR per gram, from January 2006) when a rate changed.
Run the workflow by hand with **all** ticked to fetch every month again.

The Chennai rate includes import duty; GST (3%) and making charges are added at the shop.
The "spot price in rupees" is a plain conversion with no tax:
`USD per troy ounce × USD→INR rate ÷ 31.1034768`, and 22K = 24K × 22 / 24.

Plain HTML files: no build step.
