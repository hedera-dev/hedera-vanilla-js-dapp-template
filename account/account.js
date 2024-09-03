import { getWalletInterface } from "../services/walletService.js";
import { walletConnectWallet } from '../services/walletConnectClient.js';
import { metamaskWallet } from "../services/metamaskClient.js";

async function initialize() {
  try {
    const wallet = await getWalletInterface();
    await updateAccountIdDisplay(wallet);

    // Set up the disconnect button listener
    setupDisconnectButton(wallet.walletInterface);
  } catch (error) {
    console.error('Failed to initialize wallet interface', error);
  }
}

export async function updateAccountIdDisplay(wallet) {
  if (!wallet || !wallet.walletInterface) {
    updateAccountIdDisplayText('No wallet connected.');
    return;
  }

  // Display account Id or evm address based on wallet type
  if (wallet.evmAddress) {
    updateAccountIdDisplayText(wallet.evmAddress);
  } else if (wallet.accountId) {
    updateAccountIdDisplayText(wallet.accountId);
  } else {
    updateAccountIdDisplayText('Unknown wallet');
  }
}

// Update the account ID display in the DOM
function updateAccountIdDisplayText(accountId) {
  const accountIdElement = document.getElementById("accountId");
  if (accountIdElement) {
    accountIdElement.innerHTML = accountId || "No account connected";
  } else {
    console.error("Element with ID 'accountId' not found.");
  }
}

// Set up the disconnect button with an event listener
function setupDisconnectButton(wallet) {
  const button = document.getElementById('disconnectButton');
  if (!button) {
    console.error("Button with ID 'disconnectButton' not found.");
    return;
  }

  button.addEventListener('click', async () => {
    try {
      await wallet.disconnect();
      console.log('Disconnected from wallet');
    } catch (error) {
      console.error('Failed to disconnect from wallet:', error);
    }
  });
}

// Store references to DOM elements 
const associateTokenIdElement = document.getElementById('associateTokenId');
const associateButtonElement = document.getElementById('associateButton');
const transferTokenIdElement = document.getElementById('transferTokenId');
const transferAmountElement = document.getElementById('transferAmount');
const transferToAddressElement = document.getElementById('transferToAddress');
const transferButtonElement = document.getElementById('transferButton');
const nftTokenIdElement = document.getElementById('nftTokenId');
const serialNumberElement = document.getElementById('serialNumber');
const transferToAddressNftElement = document.getElementById('transferToAddressNft');
const transferNftButtonElement = document.getElementById('transferNftButton');

// Handles associating a token depending on the wallet type
async function handleTokenAssociation() {
  const wallet = await getWalletInterface();

  try {
    const tokenId = associateTokenIdElement.value;

    if (!tokenId) {
      console.error('Token ID is required.');
      return;
    }

    // Call the appropriate associate function depending on wallet type
    if (wallet.evmAddress) {
      await metamaskWallet.associateToken(tokenId);
    } else if (wallet.accountId) {
      await walletConnectWallet.associateToken(tokenId);
    }
    console.log(`Token ${tokenId} associated successfully.`);
  } catch (error) {
    console.error(`Failed to associate token: ${error.message}`);
  }
}

// Handles transfering a token depending on the wallet type
async function handleTokenTransfer() {
  const wallet = await getWalletInterface();
  try {
    const tokenId = transferTokenIdElement.value;
    const transferToAddress = transferToAddressElement.value;
    const transferAmount = transferAmountElement.value;

    if (!tokenId || !transferToAddress) {
      console.error(`Token Id and to address are required!`);
      return;
    }

    // Call the appropriate transfer function based on wallet type
    await wallet.walletInterface.transferFungibleToken(transferToAddress, tokenId, transferAmount);
    console.log(`Token ${tokenId} transferred to ${transferToAddress} successfully.`);
  } catch (error) {
    console.error(`Failed to transfer token ${error.message}`);
  }
}

async function handleNftTransfer() {
  const wallet = await getWalletInterface();
  try {
    const nftTokenId = nftTokenIdElement.value;
    const toAddress = transferToAddressNftElement.value;
    const serialNumber = serialNumberElement.value;

    if (!nftTokenId || !toAddress) {
      console.error('Nft token Id and to address are required!')
    }

    await wallet.walletInterface.transferNonFungibleToken(toAddress, nftTokenId, serialNumber);
  } catch (error) {
    console.error(`Failed to transfer NFT with token Id ${nftTokenId} serial number ${serialNumber} ${error.message}`);
  }

}

// Wait for the DOM to fully load, then initialize
document.addEventListener('DOMContentLoaded', initialize);

// Attach event listeners to buttons
associateButtonElement.addEventListener('click', handleTokenAssociation);
transferButtonElement.addEventListener('click', handleTokenTransfer);
transferNftButtonElement.addEventListener('click', handleNftTransfer);
