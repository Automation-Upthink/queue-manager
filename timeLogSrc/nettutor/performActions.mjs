import { chromium } from 'playwright-core'
import browserConfig from '../browserConfig.mjs'
import { writeToGSheet } from '../gSheets.mjs'
import { slackLog } from '../slack.mjs'
export async function performActionNetTutor (creds, browser) {
  for (const cred of creds) {
    browser = await chromium.launch(browserConfig)
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginUser(page, cred)

    // some logic to check if the login was successful or no
    const loginError = await page.locator('.container #invalid').isVisible()
    if (loginError) {
      slackLog('Login failed for the user ' + cred.name + ' Client - NetTutor')
      await closeBrowser(page, browser)
      return false
    }

    // get the count of essay present in for the tutor
    const essaySpan = page.locator('#nt_pq')
    // now check if there are any essays present
    const noEssay = await essaySpan.innerText()
    await writeToGSheet('NetTutor', cred.name, noEssay)
    await closeBrowser(page, browser)
  }
}
async function loginUser (page, userCreds) {
  // browse to the website
  await page.goto('https://www.nettutor.com/')
  // await page.waitForLoadState('networkidle')
  // login into website
  await page.getByPlaceholder('username').fill(userCreds.name)
  await page.getByPlaceholder('password').fill(userCreds.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // adding a timeout just to give some extra time for api call to happen
  await page.waitForTimeout(1500)
}
async function closeBrowser (page, browser) {
  await page.close()
  if (browser !== null) {
    await browser.close()
  }
}
