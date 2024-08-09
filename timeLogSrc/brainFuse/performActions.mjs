import { chromium } from 'playwright-core'
import browserConfig from '../browserConfig.mjs'
import { writeToGSheet } from '../gSheets.mjs'
import { slackLog } from '../slack.mjs'

export async function performActionBrainFuse (creds) {
  for (const cred of creds) {
    const browser = await chromium.launch(browserConfig)
    const context = await browser.newContext()

    const page = await context.newPage()
    // login and perform all other options
    await loginUser(page, cred)

    await checkEssays(page)
    slackLog('Getting count for essay on brainfuse')

    // first check for the message of no essay if its present write 0 to sheet
    const essayListTableRows = page.locator('#inboxTable tbody')
    const tableRowCount = await essayListTableRows.evaluate((tableBody) => {
      return tableBody.querySelectorAll('tr').length
    })

    let essayCount = tableRowCount
    if (essayCount > 0) {
      const totalEssay = await page.getByText('1 - ').innerText()
      // Use a regular expression to extract everything after "of"
      const match = totalEssay.match(/of (.+)/)
      // Check if a match is found and extract the text
      if (match && match[1]) {
        essayCount = match[1]
      } else {
        slackLog("Text after 'of' not found ")
      }
      switch (cred.name) {
        case 'CwTutor102':
          essayCount = essayCount - 14
          break
        case 'CwTutor116':
          essayCount = essayCount - 11
          break
        case 'CwTutor121':
          essayCount = essayCount - 12
          break
        default:
          break
      }
    }
    slackLog('Total essays count is ' + essayCount + ' for BrainFuse')
    await writeToGSheet('BrainFuse', cred.name, essayCount)
    await page.close()
    if (browser !== null) {
      await browser.close()
    }
  }
}

export async function loginUser (page, userCreds) {
  // browse to the website
  await page.goto('https://www.brainfuse.com/jsp/user/inboxAction/view?box=tasks#Inbox')
  // login into website
  await page.locator('#login_username').fill(userCreds.name)
  await page.locator('#login_password').fill(userCreds.password)
  await page
    .getByRole('link', {
      name: 'login'
    })
    .click()
}

export async function checkEssays (page) {
  // check if essays are avialable for the user
  await page.locator('.inbox-error-msg').isHidden()
  await page.waitForSelector('.loader-container', { state: 'hidden' })

  await page.locator('.inbox-error-msg').isHidden()
  const visible = await page.locator('.inbox-error-msg').isVisible()
  return visible
}
