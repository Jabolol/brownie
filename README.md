<img align="right" src="./assets/brownie.png" height="150px" alt="a kawaii brownie" />

# brownie

Add support for **Google Analytics** to your GitHub readme and cache your images
for a faster loading experience!

## getting started

1. Install deno if you haven't already:

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
```

2. Clone the repo:

```sh
git clone git@github.com:Jabolol/brownie.git .
```

3. Fill in the [`.env`](./.env.example) file:

```sh
cp .env.example .env && vim .env
```

4. Edit the [`config.ts`](./config.ts) file to add your images and the cron
   schedule to cache the images:

```ts
export const config: RouteConfig = {
  routes: {
    cocoa: "https://my-stats.dev/contribs",
    vanilla: "https://my-stats.dev/issues",
  },
  schedule: {
    minute: {
      every: 20,
    },
  },
};
```

5. This will make the endpoints `/cocoa` and `/vanilla` available and cache the
   images every 20 minutes. You can add as many routes as you want!

> [!NOTE]
> It is common practice to make your routes ingredients of your brownie!

6. Deploy to [Deno Deploy](https://deno.com/deploy) and fill in the environment
   variables

7. Add your freshly baked images to your readme

```
https://[your-deployed-url].deno.dev/cocoa
```

8. The visits will be tracked in your Google Analytics dashboard!

## contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
Please run the following commands and ensure that there are no errors:

```sh
deno fmt && deno lint
```

## license

This project is licensed under the [MIT license](./LICENSE).
