# Hedera-Vanilla-JS-Dapp-Template
A decentralized application template in pure JavaScript, HTML, and CSS. It uses Vite as its build tool.

## Prerequisites
Create a wallet if you don't already have one! Select from the options below:

### Hashpack Wallet
* Install the [Hashpack extension](https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk).  

### Blade Wallet
* Install the [Blade extension](https://chrome.google.com/webstore/detail/blade-%E2%80%93-hedera-web3-digit/abogmiocnneedmmepnohnhlijcjpcifd).  

### Metamask Wallet
* Install the [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn).
* Import a Hedera ECDSA based testnet account into MetaMask.  

### Kabila Wallet
* Install the [Kabila extension](https://www.kabila.app/wallet).

#### How to activate your account on Hedera Testnet

* Activate it by transferring any 100 test HBAR to your EVM address using our faucet at https://portal.hedera.com/faucet



# How to Set up
Update the `PROJECT_ID` in `services/walletConnectClient.js` to be your own wallet connect project id.

## Need an alternative JSON RPC Relay Endpoint? 
This DApp utilizes [Hashio](https://swirldslabs.com/hashio/) to connect to Hedera Testnet over RPC.
There are more options available to establish a connection to Hedera Networks:
* Hashio
* Validation Cloud
* Hedera JSON RPC Relay
* QuickNode

Follow the guide [how to connect to Hedera Networks over RPC](https://docs.hedera.com/hedera/tutorials/more-tutorials/json-rpc-connections) to learn how to connect.

# How to Run
1. Clone the repo
2. `npm i` to install dependencies
3. `npm run dev`

# How to Build
`npm run build`

## License
Apache 2.0
