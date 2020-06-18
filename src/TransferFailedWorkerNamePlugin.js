import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'TransferFailedWorkerNamePlugin';

export default class TransferFailedWorkerNamePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {

    const showTransferFailedNotification = async (payload) => {
      const { id, context } = payload;
      const { reason } = context;

      const reasonWords = reason.split(' ');
      const workerSid = reasonWords.find(w => w.toLowerCase().startsWith('wk'));

      // Using a custom Twilio Function to retrieve the worker details since there
      // isn't an efficient method of retrieving a single worker built into the Flex UI
      const fetchUrl = 'https://transfer-failed-notification-5760-dev.twil.io/get-worker';
      const fetchBody = {
        Token: manager.store.getState().flex.session.ssoTokenPayload.token,
        workerSid
      };
      const fetchOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: new URLSearchParams(fetchBody)
      };
      const fetchResponse = await fetch(fetchUrl, fetchOptions);

      const worker = fetchResponse && await fetchResponse.json();
      const workerName = worker && worker.fullName;
      console.debug('Transfer worker fullName:', workerName);

      const newReasonWords = reasonWords.map( word => {
        if (word.toLowerCase().startsWith('wk')) {
          return workerName;
        } else {
          return word;
        }
      });

      const newContext = {
        reason: newReasonWords.join(' ')
      };
      flex.Notifications.showNotification(id, newContext);
    }

    flex.Notifications.addListener('beforeAddNotification', (payload, abortOriginal) => {
      const { id, context } = payload;
      if (id !== 'TransferFailed') {
        console.debug('*** Not TransferFailed');
        return;
      }
      const reason = (context && context.reason) || '';
      if (!reason.toLowerCase().includes('worker wk')) {
        console.debug('*** No worker in reason');
        return;
      }
      // At this point we determined it's a TransferFailed notification with a
      // worker SID in the failure reason. Since the Notifications API does not
      // 'await' this callback before completing the 'AddNotification' action,
      // it's necessary to abort the original action and invoke it ourselves.
      abortOriginal();
      showTransferFailedNotification(payload);
    })
  }
}
