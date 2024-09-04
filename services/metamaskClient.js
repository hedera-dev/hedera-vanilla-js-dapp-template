import { ethers } from "ethers";
import { ContractFunctionParameterBuilder } from "./contractFunctionParameterBuilder.js";
import { performRedirect } from "./redirectService.js";
import { AccountId } from "@hashgraph/sdk";

const CURRENT_NETWORK = 'testnet';
const NETWORK_CHAIN_ID = '0x128';

const METAMASK_GAS_LIMIT_ASSOCIATE = 800_000;
const METAMASK_GAS_LIMIT_TRANSFER_FT = 50_000;
const METAMASK_GAS_LIMIT_TRANSFER_NFT = 100_000;

/* Set up a JSON-RPC endpoint for this project to connect to Hedera Testnet.
    Ref: https://docs.hedera.com/hedera/tutorials/more-tutorials/json-rpc-connections */
const RPC_URL = 'https://testnet.hedera.validationcloud.io/v1/GYSdi5Rlhc-NmoBLSVJGsqVQDOL6C4lCCQbyHc3NvsM';

export const switchToHederaNetwork = async (ethereum) => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CHAIN_ID }] // chainId must be in hexadecimal numbers
    });
  } catch (error) {
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: `Hedera (${CURRENT_NETWORK})`,
              chainId: NETWORK_CHAIN_ID,
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18
              },
              rpcUrls: [RPC_URL]
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
    console.error(error);
  }
}

const { ethereum } = window;

const getProvider = () => {
  if (!ethereum) {
    throw new Error("An EVM wallet is not installed! If needed, go install the extension!");
  }

  return new ethers.providers.Web3Provider(ethereum);
}

// returns a list of accounts
// otherwise empty array
export const connectToMetamask = async () => {
  const provider = getProvider();

  // keep track of accounts returned
  let accounts = [];

  try {
    await switchToHederaNetwork(ethereum);
    accounts = await provider.send("eth_requestAccounts", []);

  } catch (error) {
    if (error.code === 4001) {
      // EIP-1193 userRejectedRequest error
      console.warn("Please connect to Metamask.");
    } else {
      console.error(error);
    }
  }

  return accounts;
}

class MetaMaskWallet {
  _convertAccountIdToSolidityAddress(accountId) {
    console.log(`account id that has come in ${accountId}`);
    if (accountId.startsWith('0x')) {
      console.log(`account id is already formatted. Returning ${accountId}`);
      return accountId;
    }

    const hederaAccount = AccountId.fromString(accountId);
    console.log(`account id that has gone through AccountId.fromString() is hederaAccount: ${hederaAccount}`);
    console.log(`Viewing hederaAccount.evmAddres ${hederaAccount.evmAddress}`);
    const accountIdString = hederaAccount.evmAddress !== null
      ? hederaAccount.evmAddress.toString()
      : hederaAccount.toSolidityAddress(); // when we are working with a hedera account
    console.log(`This is now accountIdString ${accountIdString}`);

    return `0x${accountIdString}`;
  }

  // Purpose: Transfer HBAR
  // Returns: Promise<string>
  // Note: Use JSON RPC Relay to search by transaction hash
  async transferHBAR(toAddress, amount) {
    const provider = getProvider();
    const signer = provider.getSigner();
    // build the transaction
    const tx = await signer.populateTransaction({
      to: this._convertAccountIdToSolidityAddress(toAddress),
      value: ethers.utils.parseEther(amount.toString()),
    });
    try {
      // send the transaction
      const { hash } = await signer.sendTransaction(tx);
      await provider.waitForTransaction(hash);

      return hash;
    } catch (error) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  async transferFungibleToken(toAddress, tokenId, amount) {
    console.log(`This is the token id coming in ${tokenId}`);
    console.log(`Perform a tokenId.toString() ${tokenId.toString()}`);

    const hash = await this.executeContractFunction(
      this._convertAccountIdToSolidityAddress(tokenId.toString()),
      'transfer',
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "recipient",
          value: this._convertAccountIdToSolidityAddress(toAddress)
        })
        .addParam({
          type: "uint256",
          name: "amount",
          value: amount
        }),
      METAMASK_GAS_LIMIT_TRANSFER_FT
    );

    return hash;
  }

  async transferNonFungibleToken(toAddress, tokenId, serialNumber) {
    const provider = getProvider();
    const addresses = await provider.listAccounts();
    const hash = await this.executeContractFunction(
      this._convertAccountIdToSolidityAddress(tokenId.toString()),
      'transferFrom',
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "from",
          value: addresses[0]
        })
        .addParam({
          type: "address",
          name: "to",
          value: this._convertAccountIdToSolidityAddress(toAddress)
        })
        .addParam({
          type: "uint256",
          name: "nftId",
          value: serialNumber
        }),
      METAMASK_GAS_LIMIT_TRANSFER_NFT
    );

    return hash;
  }

  async associateToken(tokenId) {
    // send the transaction
    // convert tokenId to contract id
    console.log(`in associate function ${tokenId}`);
    const hash = await this.executeContractFunction(
      this._convertAccountIdToSolidityAddress(tokenId.toString()),
      'associate',
      new ContractFunctionParameterBuilder(),
      METAMASK_GAS_LIMIT_ASSOCIATE
    );

    return hash;
  }

  // Purpose: build contract execute transaction and send to hashconnect for signing and execution
  // Returns: Promise<TransactionId | null>
  async executeContractFunction(contractId, functionName, functionParameters, gasLimit) {
    console.log(`in execute contract function. The contract id is ${contractId}`);
    const provider = getProvider();
    const signer = provider.getSigner();
    // build ABI from executeContractFunction arguments
    const abi = [
      `function ${functionName}(${functionParameters.buildAbiFunctionParams()})`
    ];

    // create contract instance for the contract id
    // to call the function, use contract[functionName](...functionParameters, ethersOverrides)
    const contract = new ethers.Contract(contractId, abi, signer);
    try {
      const txResult = await contract[functionName](
        ...functionParameters.buildEthersParams(),
        {
          gasLimit: gasLimit === -1 ? undefined : gasLimit
        }
      );
      return txResult.hash;
    } catch (error) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  disconnect() {
    alert("Please disconnect using the Metamask extension.")
  }
};

export const metamaskWallet = new MetaMaskWallet();

// keep track of account and connection status
export let evmAccountAddress = '';

// check if ethereum wallet detected
if (ethereum) {
  // initialize evm wallet
  const provider = getProvider();
  provider.listAccounts().then((signers) => {
    if (signers.length !== 0) {
      evmAccountAddress = signers[0]
      console.log(`The evm address is ${evmAccountAddress}`);
      performRedirect();
    } else {
      evmAccountAddress = "";
      console.log('no evm address found');
      performRedirect();
    }
  });

  // listen for account changes and update the account address
  ethereum.on("accountsChanged", (accounts) => {
    console.log('calling ethereum on')
    if (accounts.length !== 0) {
      evmAccountAddress = accounts[0];
      console.log(`The evm address is ${evmAccountAddress}`);
      performRedirect();
    } else {
      evmAccountAddress = "";
      console.log('no evm address found');
      performRedirect();
    }
  });
}