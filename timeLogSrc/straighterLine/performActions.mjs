import { chromium } from 'playwright-core'
import browserConfig from '../browserConfig.mjs'
import { slackLog } from '../slack.mjs'

export async function performActionStraighterLine (creds, browser) {
  for (const cred of creds) {
    // initiate browser
    browser = await chromium.launch(browserConfig)
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginUser(page, cred)

    // some logic to check if the login was successful or no
    const isLogin = page.url()
    if (!isLogin.includes('https://moodle.straighterline.com/my/')) {
      slackLog('Login failed for the user ' + cred.name + ' for StraighterLine')
      await closeBrowser(page, browser)
      return false
    }
    const essayText = await page.locator('.block_assignment_queue .content').innerText()
    if (essayText.includes('Available Submissions')) {
      slackLog('essayText --- ' + essayText + ' for StraighterLine')
    } else {
      slackLog('No essay present' + ' for StraighterLine')
    }
    await closeBrowser(page, browser)
  }
}

async function loginUser (page, userCreds) {
  // browse to the website
  await page.goto('https://course-developer-and-content-creator.s3.amazonaws.com/HTML/admin-login.html')
  await page.waitForLoadState('networkidle')
  // login into website
  await page.getByLabel('Username').fill(userCreds.name)
  await page.getByLabel('Password').fill(userCreds.password)
  await page.getByRole('button', { name: 'Login' }).click()
  // adding a timeout just to give some extra time for api call to happen
  await page.waitForTimeout(1500)
}

async function closeBrowser (page, browser) {
  await page.close()
  if (browser !== null) {
    await browser.close()
  }
}
