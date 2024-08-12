import { fetchUserCreds } from './apiService.mjs'
import dotenv from 'dotenv'
// import { slackLogError, slackLogClient } from './slack.mjs'
import { v4 as uuidv4 } from 'uuid'
import { chromium } from 'playwright-core'
import browserConfig from './browserConfig.mjs'
import { retryAction } from './retry.mjs'
dotenv.config()

export async function handler (event) {
  let clientName
  let uuid
  let browser
  try {
    // fetch all login details of all the users for a client
    clientName = event.clientName
    uuid = event.uuid
    if (uuid.includes('allFetch')) {
      uuid = uuid + '_' + uuidv4()
    }
    // await slackLogError(uuid, 'Starting execution with event body', clientName)
    // await slackLogError(uuid, JSON.stringify(event), clientName)
    // slackLogClient(uuid, 'event body ', clientName)
    // slackLogClient(uuid, JSON.stringify(event), clientName)
    // slackLogClient(uuid, 'clientName is - ' + clientName + ' uuid - ' + uuid, clientName)
    if (clientName !== '' && uuid !== undefined) {
      // perform action
      const userCreds = await fetchUserCreds(uuid, clientName)
      if (userCreds != null) {
        // slackLogClient(
        //   uuid,
        //   'Performing actions for ' + userCreds.length + ' credentials for ' + clientName,
        //   clientName
        // )
        // loop through the users in usercreds
        for (const element of userCreds) {
          // check for download remaining
          const user = element
          // slackLogClient(uuid, 'Performing actions for ' + user.name, clientName)
          if (user.downloadLimit <= 0) {
            // slackLogClient(uuid, 'Downloadlimit exceeds ' + user.name, clientName)
            continue
          }
          if (event.singleDownload) {
            user.downloadLimit = 1
          }
          browser = await chromium.launch(browserConfig)
          const singleDownloaded = await retryAction(uuid, user, browser, event.singleDownload, clientName)
          if (browser !== null) {
            await browser.close()
          }
          // slackLogClient(uuid, 'Action completed for ' + user.name, clientName)
          if (singleDownloaded) {
            // slackLogClient(uuid, 'Single essay downloaded -', clientName)
            return {
              body: 'Single essay downloaded'
            }
          }
        }
        if (browser !== null) {
          await browser?.close()
        }
      } else {
        // slackLogClient(uuid, 'No creds present for client ', clientName)
      }
      // await slackLogError(uuid, 'Execution complete ', clientName)
    } else {
      // await slackLogError(uuid, 'Stopping execution, no client name or uuid specified', clientName)
    }
  } catch (error) {
    // await slackLogError(uuid, 'Catched an error' + error, clientName)
  } finally {
    if (browser !== null) {
      await browser?.close()
    }
  }
  console.log(event);
  return event
}
// handler({ clientName: 'BrainFuse', singleDownload: true, uuid: 'testing-retry' })
