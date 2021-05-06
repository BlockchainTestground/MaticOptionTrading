# Dependencies

```bash
npm install
```

# Compile

```bash
truffle compile
```

# Deploy

Create a new migration on the `./migrations/` directory following the same sequence. Create a `.secret` file and paste your mnemonic. An then:

```bash
truffle migrate --network mumbai
truffle migrate --network matic
```
