![Alt text](client/img/logo.png?raw=true)

## Dependencies

```bash
npm install
```

## Compile

```bash
truffle compile
```

## Related contracts and documentation

This projects uses the [Link Token Contract](https://docs.chain.link/docs/link-token-contracts/) and [Chainlink Matic Price Feeds](https://data.chain.link/) on the [Polygon Network](https://docs.chain.link/docs/matic-addresses/). For more information read this chainlink's blog posts about [Option Exchanges](https://blog.chain.link/defi-call-option-exchange-in-solidity/) and about using [Price Feeds](https://blog.chain.link/matic-defi-price-feeds/).

* Matic:
  * Link Contract: `0xb0897686c545045aFc77CF20eC7A532E3120E0F1`
  * MATIC / USD: `0xAB594600376Ec9fD91F8e885dADF0CE036862dE0`
* Mumbai:
  * Link Contract: `0x326C977E6efc84E512bB9C30f76E30c160eD06FB`
  * MATIC / USD: `0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada`

## Deploy

Create a new migration on the `./migrations/` directory following the same sequence. Create a `.secret` file and paste your mnemonic. An then:

```bash
truffle migrate --network mumbai
truffle migrate --network matic
```

## Client

Now run the client.

```bash
cd client
lite-server
```

The server should be running now on port 3000.

The smart contract ABI is located at `/client/contracts/OptionTrades.json`.
