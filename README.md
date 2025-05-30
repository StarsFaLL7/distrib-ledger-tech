# 📝 Смарт-контракт для протекции сделки с криптовалютой (ETH или IERC20 токены) третьей стороной.

Логика работы:
1. Покупатель создаёт сделку через createDeal() или createDealEth(), указывая продавца, арбитра, сумму и срок сделки;
2. Криптовалюта поступает на смарт-контракт, где также создаётся сделка, ожидающая подтверждения обеих сторон;
3. Покупатель и Продавец могут подтвердить сделку через approveDeal(), указав id сделки;
4. Если сделка подтверждена с обеих сторон, продавец может вывести криптовалюту через withdrawFunds();
5. Если возник конфликт, арбитр может закончить сделку через resolveDispute() в пользу любого участника с переводом криптовалюты на его счёт;
6. Если срок сделки истёк, но подтверждение от обеих сторон не поступило, только арбитр может её завершить.

[![2025-05-30-151703.png](https://i.postimg.cc/mkdbTwXb/2025-05-30-151703.png)](https://postimg.cc/sGhFcpC8)

Итоговый проект по курсу "Технологии распределенного реестра", УрФУ, весенний семестр 2024-2025 гг.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install the latest version of Scaffold-ETH 2

```
npx create-eth@latest
```

This command will install all the necessary packages and dependencies, so it might take a while.

> [!NOTE]
> You can also initialize your project with one of our extensions to add specific features or starter-kits. Learn more in our [extensions documentation](https://docs.scaffoldeth.io/extensions/).

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network that runs on your local machine and can be used for testing and development. Learn how to [customize your network configuration](https://docs.scaffoldeth.io/quick-start/environment#1-initialize-a-local-blockchain).

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. You can find more information about how to customize your contract and deployment script in our [documentation](https://docs.scaffoldeth.io/quick-start/environment#2-deploy-your-smart-contract).

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

**What's next**:

Visit the [What's next section of our docs](https://docs.scaffoldeth.io/quick-start/environment#whats-next) to learn how to:

- Edit your smart contracts
- Edit your deployment scripts
- Customize your frontend
- Edit the app config
- Writing and running tests
- [Setting up external services and API keys](https://docs.scaffoldeth.io/deploying/deploy-smart-contracts#configuration-of-third-party-services-for-production-grade-apps)

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn all the technical details and guides of Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
