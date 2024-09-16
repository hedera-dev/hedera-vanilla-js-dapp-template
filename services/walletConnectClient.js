import { AccountId, ContractExecuteTransaction, LedgerId, TokenAssociateTransaction, TokenId, TransferTransaction } from "@hashgraph/sdk";
import { DAppConnector, HederaJsonRpcMethod, HederaSessionEvent, HederaChainId } from "@hashgraph/hedera-wallet-connect";
import { performRedirect } from "./redirectService.js";

// state to keep track of the account and connection
export let accountId = '';
let isConnected = false;

// Function to sync the walletconnect state
function syncWalletconnectState() {
  const account = dappConnector.signers[0]?.getAccountId()?.toString();

  // set walletconnect state
  if (account) {
    accountId = account;
    isConnected = true;
    console.log(`Connection status: ${isConnected}. This is the account id ${accountId}`);
    performRedirect()
  } else {
    accountId = '';
    isConnected = false;
    console.log(`Connection status: ${isConnected}. This is the account id ${accountId}`);
    performRedirect()
  }
}

export const NETWORK_CONFIG = {
  testnet: {
    network: "testnet",
    jsonRpcUrl: "https://testnet.hashio.io/api", // check out the readme for alternative RPC Relay urls
    mirrorNodeUrl: "https://testnet.mirrornode.hedera.com",
    chainId: "0x128",
  }
}

// Create a new project in walletconnect cloud to generate a project id
const walletConnectProjectId = "PROJECT_ID";
const currentNetworkConfig = NETWORK_CONFIG.testnet;
const hederaNetwork = currentNetworkConfig.network;

// Adapted from walletconnect dapp example:
// https://github.com/hashgraph/hedera-wallet-connect/blob/main/src/examples/typescript/dapp/main.ts#L87C1-L101C4
const metadata = {
  name: "Hedera CRA Template",
  description: "Hedera CRA Template",
  url: window.location.origin,
  icons: [window.location.origin + "/logo192.png"],
}
const dappConnector = new DAppConnector(
  metadata,
  LedgerId.fromString(hederaNetwork),
  walletConnectProjectId,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [HederaChainId.Testnet],
);

// ensure walletconnect is initialized only once
let walletConnectInitPromise = undefined;
export const initializeWalletConnect = async () => {
  if (walletConnectInitPromise === undefined) {
    walletConnectInitPromise = dappConnector.init();
  }
  await walletConnectInitPromise;
};

export const openWalletConnectModal = async () => {
  await initializeWalletConnect();
  await dappConnector.openModal().then((x) => {
    syncWalletconnectState()
  });
};

class WalletConnectWallet {
  _getSigner() {
    if (dappConnector.signers.length === 0) {
      throw new Error('No signers found!');
    }
    return dappConnector.signers[0];
  }

  _getAccountId() {
    // Need to convert from walletconnect's AccountId to hashgraph/sdk's AccountId because walletconnect's AccountId and hashgraph/sdk's AccountId are not the same!
    return AccountId.fromString(this._getSigner().getAccountId().toString());
  }

  async transferHBAR(toAddress, amount) {
    const transferHBARTransaction = new TransferTransaction()
      .addHbarTransfer(this._getAccountId(), -amount)
      .addHbarTransfer(toAddress, amount);

    const signer = this._getSigner();
    await transferHBARTransaction.freezeWithSigner(signer);
    const txResult = await transferHBARTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async transferFungibleToken(toAddress, tokenId, amount) {
    if (tokenId.startsWith('0x')) {
      tokenId = TokenId.fromSolidityAddress(tokenId).toString();
    }

    const transferTokenTransaction = new TransferTransaction()
      .addTokenTransfer(tokenId, this._getAccountId(), -amount)
      .addTokenTransfer(tokenId, toAddress.toString(), amount);

    const signer = this._getSigner();
    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async transferNonFungibleToken(toAddress, tokenId, serialNumber) {
    if (tokenId.startsWith('0x')) {
      tokenId = TokenId.fromSolidityAddress(tokenId).toString();
    }
    const transferTokenTransaction = new TransferTransaction()
      .addNftTransfer(tokenId, serialNumber, this._getAccountId(), toAddress);

    const signer = this._getSigner();
    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async associateToken(tokenId) {
    const associateTokenTransaction = new TokenAssociateTransaction()
      .setAccountId(this._getAccountId())
      .setTokenIds([tokenId]);

    const signer = this._getSigner();
    await associateTokenTransaction.freezeWithSigner(signer);
    const txResult = await associateTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  // Purpose: build contract execute transaction and send to wallet for signing and execution
  // Returns: Promise<TransactionId | null>
  async executeContractFunction(contractId, functionName, functionParameters, gasLimit) {
    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(gasLimit)
      .setFunction(functionName, functionParameters.buildHAPIParams());

    const signer = this._getSigner();
    await tx.freezeWithSigner(signer);
    const txResult = await tx.executeWithSigner(signer);

    // in order to read the contract call results, you will need to query the contract call's results form a mirror node using the transaction id
    // after getting the contract call results, use ethers and abi.decode to decode the call_result
    return txResult ? txResult.transactionId : null;
  }
  // disconnect and then re-direct back to the home page.
  disconnect() {
    console.log('clicked disconnect');
    dappConnector.disconnectAll().then(() => {
      syncWalletconnectState()
    });
  }
};
export const walletConnectWallet = new WalletConnectWallet();

// Initialize walletConnect and sync after initialization
initializeWalletConnect().then(() => {
  syncWalletconnectState();
});
