import ActionTypes from '~/client/store/ethereum/types';
import notify from '~/client/store/notifications/actions';
import translate from '~/common/services/i18n';
import web3 from '~/common/services/web3';
import { detectMetaMask, enableProvider } from '~/client/services/ethereum';
import { isOwner } from '~/common/services/contracts/owners';

async function handleAccountChange(accounts) {
  const isOwnerState =
    accounts && accounts.length > 0 ? await isOwner(accounts[0]) : false;
  return {
    type: ActionTypes.ETHEREUM_ACCOUNT_CHANGED,
    meta: {
      account: accounts[0],
      isOwner: isOwnerState,
    },
  };
}

// Helper method to generate string identifier for pending transactions
export function getTransactionId(txMethod, params) {
  return Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        if (params[key]) {
          acc.push(params[key].toString());
        }
        return acc;
      },
      [txMethod.toString()],
    )
    .join('-');
}

export function initializeProvider() {
  return async (dispatch) => {
    const provider = await detectMetaMask();
    const hasProvider = !!provider;

    if (hasProvider) {
      provider.on('accountsChanged', async (accounts) => {
        dispatch(await handleAccountChange(accounts));
      });
    }

    dispatch({
      type: ActionTypes.ETHEREUM_INITIALIZE,
      meta: {
        hasProvider,
      },
    });
  };
}

export function enableAccount() {
  return async (dispatch) => {
    const accounts = await enableProvider();

    dispatch(
      notify({
        text: translate('ethereum.notificationAccountEnabled'),
      }),
    );

    dispatch(await handleAccountChange(accounts));
  };
}

export function addPendingTransaction({ txMethod, txHash, params = {} }) {
  return {
    type: ActionTypes.ETHEREUM_TRANSACTIONS_ADD,
    meta: {
      id: getTransactionId(txMethod, params),
      txHash,
    },
  };
}

export function checkPendingTransactions() {
  return async (dispatch, getStore) => {
    const { ethereum } = getStore();

    for (let id of Object.keys(ethereum.transactions)) {
      const transaction = ethereum.transactions[id];

      if (!transaction.isPending) {
        continue;
      }

      const receipt = await web3.eth.getTransactionReceipt(transaction.txHash);

      const isPending = receipt === null;
      const isError = !isPending && !receipt.status;

      if (
        transaction.isPending !== isPending ||
        transaction.isError !== isError
      ) {
        dispatch({
          type: ActionTypes.ETHEREUM_TRANSACTIONS_UPDATE,
          meta: {
            id,
            isError,
            isPending,
            isSuccess: !isError && !isPending,
          },
        });
      }
    }
  };
}
