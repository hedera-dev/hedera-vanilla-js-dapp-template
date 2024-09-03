import { metamaskWallet, evmAccountAddress } from "./metamaskClient.js";
import { walletConnectWallet, accountId, initializeWalletConnect } from "./walletConnectClient.js";

export const getWalletInterface = async () => {
  console.log({evmAccountAddress, accountId});
  // wait for walletconnect to initialize
  await initializeWalletConnect();

  if (evmAccountAddress) {
    return {
      evmAddress: evmAccountAddress,
      accountId: null,
      walletInterface: metamaskWallet
    };
  } else if (accountId) {
    return {
      accountId: accountId,
      evmAddress: null,
      walletInterface: walletConnectWallet
    };
  } else {
    return {
      accountId: null,
      evmAddress: null,
      walletInterface: null
    }
  }
}