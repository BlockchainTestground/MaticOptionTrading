import logo from './logo.svg';
import './App.css';
import ReactDOM from 'react-dom'

import React from "react";
import { formatEther } from '@ethersproject/units'
import { DAppProviderx, Web3ReactProviderx, useEtherBalance, useEthers } from '@usedapp/core'

const config = {
  readOnlyChainId: 137,
  readOnlyUrls: {
    [137]: 'https://rpc-mainnet.maticvigil.com',
  },
}

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <App />
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

export function App() {
  const { activateBrowserWallet, account } = useEthers()
  const etherBalance = useEtherBalance(account)
  return (
    <div>
      <div>
        <button onClick={() => activateBrowserWallet()}>Connect</button>
      </div>
      {account && <p>Account: {account}</p>}
      {etherBalance && <p>Balance: {formatEther(etherBalance)}</p>}
    </div>
  )
}

export default App;