import { connectToMetamask } from './services/metamaskClient.js';
import { openWalletConnectModal } from './services/walletConnectClient.js';

document.getElementById('metamaskButton').addEventListener('click', () => {
  connectToMetamask();
});
document.getElementById('walletconnectButton').addEventListener('click', () => {
  openWalletConnectModal();
});
