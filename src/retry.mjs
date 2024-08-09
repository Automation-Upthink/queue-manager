import { performActionBrainFuse } from './brainFuse/performActions.mjs'
// import { performActionNetTutor } from './nettutor/performActions.mjs'
// import { performActionStraighterLine } from './straighterLine/performActions.mjs'
// import { slackLogClient, slackLogError } from './slack.mjs'
import { chromium } from 'playwright-core'
import browserConfig from './browserConfig.mjs'
async function attemptAction (retries, isRetry, uuid, user, browser, singleDownload, clientName) {
  try {
    if (isRetry) {
      // close browser
      await browser.close()
      // start new browser
      browser = await chromium.launch(browserConfig)
    }
    switch (clientName) {
      case 'BrainFuse':
        // slackLogClient(uuid, 'BrainFuse action performed', clientName)
        return await performActionBrainFuse(uuid, user, browser, singleDownload)
      case 'NetTutor':
        // slackLogClient(uuid, 'NetTutor action performed', clientName)
        return await performActionNetTutor(uuid, user, browser, singleDownload)
      case 'StraighterLine':
        // slackLogClient(uuid, 'StraighterLine action performed', clientName)
        return await performActionStraighterLine(uuid, user, browser, singleDownload)
      default:
        // slackLogClient(uuid, 'No action present for -', clientName)
        break
    }
  } catch (err) {
    // await slackLogError(uuid, `Action failed (Retry ${retries}) --> ${err}`, clientName)
    return 'false'
  } finally {
    await browser.close()
  }
}
export async function retryAction (uuid, user, browser, singleDownload, clientName, maxRetries = 2) {
  let retries = 1
  let isRetry = false
  while (retries <= maxRetries) {
    const success = await attemptAction(retries, isRetry, uuid, user, browser, singleDownload, clientName)
    if (success !== 'false') {
      return success
    }
    retries++
    console.log(retries)
    isRetry = true
    if (retries < maxRetries) {
      // Delay for 10 seconds before the next retry
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }
  }
  // await slackLogError(uuid, 'Failed after max retry', clientName)
  return false
}
