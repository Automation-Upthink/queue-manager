import dotenv from 'dotenv'
import { performActionNetTutor } from './nettutor/performActions.mjs'
import { performActionBrainFuse } from './brainFuse/performActions.mjs'
import { slackLog } from './slack.mjs'
import { loadCredsFromSheet } from './gSheets.mjs'
dotenv.config()

export async function handler (event) {
  const browser = null
  const credList = await loadCredsFromSheet()
  try {
    for (const cred of credList) {
      // check for download remaining
      const clientName = cred.clientName
      const clientCreds = cred.creds
      switch (clientName) {
        case 'NetTutor':
          slackLog('Checking for netTutor essay count')
          await performActionNetTutor(clientCreds, browser)
          slackLog('Action performed for netTutor essay count')
          break
        case 'BrainFuse':
          slackLog('Checking for brainFuse essay count', clientName)
          await performActionBrainFuse(clientCreds, browser)
          slackLog('Action performed for brainFuse essay count')
          break
        case 'StraighterLine':
          slackLog('Checking for straighterLine essay count', clientName)
          slackLog('Action performed for straighterLine essay count')
          break
        default:
          break
      }
    }
    if (browser !== null) {
      await browser.close()
    }
  } catch (error) {
    slackLog('Catched an error' + error)
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
  return event
}
// handler()
