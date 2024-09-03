import { getWalletInterface } from "./walletService.js";

export const performRedirect = async () => {
  // if youre logged in with any accounts and on the home page then redirect to account page.
  // if youre not logged in with any account and youre not on the home page then go back to home page
  // else do nothing.
  // call this function inside the metamasclient and walletconnect client whenever we syn cstate.
  const wallet = await getWalletInterface();
  if (wallet.walletInterface && window.location.pathname == '/') {
    window.location.href = '/account/';
  } else if (!wallet.walletInterface && window.location.pathname !== '/') {
    window.location.href = '/';
  } else {
    console.log('No redirection needed');
  }
}