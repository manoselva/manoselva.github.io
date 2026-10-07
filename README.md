# gold-price-Chart

Live site: https://manoselva.github.io

| Page | What it shows | Data |
|---|---|---|
| [`index.html`](https://manoselva.github.io/) | Live gold, silver, platinum and palladium prices (USD per troy ounce), and India prices in INR: 24K and 22K gold per gram and per 10 g, silver per gram and per kg. Refreshes every 15 s. | [gold-api.com](https://gold-api.com) live spot and USD→INR; [ExchangeRate-API](https://www.exchangerate-api.com) backup rate; [exchange-api](https://github.com/fawazahmed0/exchange-api) daily reference for the change figures; [BullionVault](https://www.bullionvault.com) chart |
| [`currency.html`](https://manoselva.github.io/currency.html) | Currency converter for 160+ currencies. Live rates every 30 s where available, daily rates for the rest. | gold-api.com (live), ExchangeRate-API (daily), exchange-api (backup) |

The INR per-gram price is a plain conversion with no tax added:
`USD per troy ounce × USD→INR rate ÷ 31.1034768`, and 22K = 24K × 22 / 24.
Shop prices in India also include import duty, GST and making charges.

Plain HTML files: no build step. All data sources are free, need no API key, and allow browser requests (CORS).
