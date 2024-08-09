// import { slackLogClient, slackLogError } from '../slack.mjs'
// import fs from 'fs'
// import { generateSignedUrl, uploadFileToS3, addEssay } from '../apiService.mjs'

// const slackClientName = 'NetTutor'
// export async function performActionNetTutor (uuid, user, browser, isSingle) {
//   if (user.downloadLimit > 0 && user.downloadRemaining > 0) {
//     // initiate browser
//     const context = await browser.newContext()
//     const page = await context.newPage()
//     await loginUser(page, user)

//     // some logic to check if the login was successful or no
//     const loginError = await page.locator('.container #invalid').isVisible()
//     if (loginError) {
//       slackLogError(uuid, 'Login failed for the user ' + user.name, slackClientName)
//       await closeBrowser(page, context)
//       return false
//     }

//     // get the count of essay present in for the tutor
//     const essaySpan = page.locator('#nt_pq')
//     const essayInProg = page.locator('#nt_pt')
//     const noInProg = await essayInProg.innerText()
//     // check if there is an essay in progress already
//     if (noInProg > 0) {
//       slackLogClient(uuid, 'Already a essay is in prog for user ' + user.name, slackClientName)
//       await closeBrowser(page, context)
//       return false
//     }
//     // now check if there are any essays present
//     const noEssay = await essaySpan.innerText()
//     if (noEssay <= 0) {
//       slackLogClient(uuid, 'no essay present', slackClientName)
//       await closeBrowser(page, context)
//       return false
//     }

//     slackLogClient(uuid, 'essay present for ' + user.name, slackClientName)
//     const essayAccepted = await browseAndDownloadEssay(uuid, page, essaySpan, user, isSingle)
//     await closeBrowser(page, context)
//     return essayAccepted
//   } else {
//     slackLogClient(uuid, 'Download limit exceeded or user ' + user.name, slackClientName)
//     return false
//   }
// }
// async function loginUser (page, userCreds) {
//   // browse to the website
//   await page.goto('https://www.nettutor.com/')
//   await page.waitForLoadState('networkidle')
//   // login into website
//   await page.getByPlaceholder('username').fill(userCreds.name)
//   await page.getByPlaceholder('password').fill(userCreds.password)
//   await page.getByRole('button', { name: 'Sign In' }).click()
//   // adding a timeout just to give some extra time for api call to happen
//   await page.waitForTimeout(1500)
// }
// async function browseAndDownloadEssay (uuid, page, essaySpan, user, isSingle) {
//   // click on the available essay
//   const pagePromise = page.waitForEvent('popup')
//   await essaySpan.click()
//   const page1 = await pagePromise
//   await page1.waitForLoadState('networkidle')

//   // click on Proof next paper in line to open essay
//   await page1.getByRole('button', { name: 'Proof next paper in line' }).click()
//   await page1.waitForLoadState('networkidle')

//   // if code comes here the essay is opened now download and accept
//   // accept the essay first
//   const pageUrl = page1.url()
//   const taskId = new URLSearchParams(pageUrl.split('?')[1]).get('pid')
//   const fileName = taskId + '_' + user.name + '.pdf'

//   slackLogClient(uuid, 'accepted ' + fileName + ' for ' + user.name, slackClientName)
//   if (taskId == null) {
//     return
//   }
//   await addEssay(uuid, taskId, fileName, user)

//   // download essay
//   const items = page1.locator('#menubar > li')
//   await items.nth(0).click({ force: true })
//   const downloadPromise = page1.waitForEvent('download')
//   await page1.getByText('Save as PDF').click()
//   const download = await downloadPromise
//   await download.saveAs(`/tmp/${fileName}`)

//   // upload the essay file to our server
//   // now generate signedUrl
//   const signedUrl = await generateSignedUrl(uuid, fileName, 'file', taskId, user.clientName)
//   // upload the file to s3
//   const fileContent = fs.readFileSync(`/tmp/${fileName}`)
//   await uploadFileToS3(uuid, signedUrl, fileContent, taskId, user.clientName)
//   fs.unlinkSync(`/tmp/${fileName}`)
//   if (isSingle) {
//     return true
//   }
// }
// async function closeBrowser (page, context) {
//   await page.close()
//   await context.close()
// }
