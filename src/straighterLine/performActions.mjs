// import { generateSignedUrl, uploadFileToS3, addEssay } from '../apiService.mjs'
// import fs from 'fs'
// import { slackLogClient, slackLogError } from '../slack.mjs'
// const slackClientName = 'StraighterLine'
// export async function performActionStraighterLine (uuid, user, browser, isSingle) {
//   if (user.downloadLimit > 0) {
//     // initiate browser
//     const context = await browser.newContext()
//     const page = await context.newPage()
//     await loginUser(page, user)

//     // some logic to check if the login was successful or no
//     const isLogin = page.url()
//     if (!isLogin.includes('https://moodle.straighterline.com/my/')) {
//       await slackLogError(uuid, 'Login failed for the user ' + user.name, slackClientName)
//       await closeBrowser(page, context)
//       return false
//     }
//     // browse and download essays now
//     const essayAccepted = await browseEssay(uuid, page, isSingle, user)
//     await closeBrowser(page, context)
//     return essayAccepted
//   } else {
//     slackLogClient(uuid, 'Download limit exceeded or user ' + user.name, slackClientName)
//   }
// }

// async function loginUser (page, userCreds) {
//   // browse to the website
//   await page.goto('https://course-developer-and-content-creator.s3.amazonaws.com/HTML/admin-login.html')
//   await page.waitForLoadState('networkidle')
//   // login into website
//   await page.getByLabel('Username').fill(userCreds.name)
//   await page.getByLabel('Password').fill(userCreds.password)
//   await page.getByRole('button', { name: 'Login' }).click()
//   // adding a timeout just to give some extra time for api call to happen
//   await page.waitForTimeout(1500)
// }

// async function browseEssay (uuid, page, isSingle, user) {
//   const essayText = await page.locator('.block_assignment_queue .content').innerText()
//   slackLogClient(uuid, 'Login success ' + user.clientName + user.id, slackClientName)
//   if (essayText.includes('Available Submissions')) {
//     slackLogClient(uuid, 'essayText --- ' + essayText, slackClientName)
//     const gradeNextBtn = page.getByRole('button', { name: 'Grade Next' })
//     const isVisible = await gradeNextBtn.isVisible()
//     if (isVisible) {
//       // we can click on the button and download the essay
//       return await viewAndDownloadEssay(uuid, page, isSingle, user)
//     } else {
//       // something is wrong/changed there is not button to view essay
//       slackLogClient(uuid, 'No button to view essay, you might have an active essay already', slackClientName)
//     }
//   } else {
//     slackLogClient(uuid, 'No essay present', slackClientName)
//   }
// }

// async function viewAndDownloadEssay (uuid, page, isSingle, user) {
//   slackLogClient(uuid, 'started viewing and downloading essays for ' + user.name, slackClientName)
//   await page.waitForLoadState('networkidle')
//   await page.locator('#block_assignment_queue_grade_next').click({ force: true })
//   const popupPromise = page.waitForEvent('popup')
//   const page1 = await popupPromise
//   await page1.waitForLoadState('networkidle')
//   slackLogClient(uuid, 'opened an essay for ' + user.name, slackClientName)
//   const pageUrl = page1.url()
//   const taskId = new URLSearchParams(pageUrl.split('?')[1]).get('o')
//   if (taskId == null) {
//     return
//   }
//   // const authName = await page1.locator('.author-name').innerText()
//   const essayTitle = await page1.locator('.title').innerText()
//   const fileName = taskId + '_' + essayTitle + '.pdf'
//   slackLogClient(uuid, 'accepted ' + fileName + ' for ' + user.name, slackClientName)
//   // now that essay is accepted we first update db then upload it to s3
//   await addEssay(uuid, taskId, fileName, user)
//   await page1.getByLabel('Download', { exact: true }).click()
//   const downloadPromise = page1.waitForEvent('download')
//   await page1.getByLabel('Current View').click()
//   const download = await downloadPromise
//   // await download.saveAs('./slessay.pdf')
//   await download.saveAs(`/tmp/${fileName}`)
//   // upload the essay file to our server
//   // now generate signedUrl
//   const signedUrl = await generateSignedUrl(uuid, fileName, 'file', taskId, 'StraighterLine')
//   // upload the file to s3
//   const fileContent = fs.readFileSync(`/tmp/${fileName}`)
//   await uploadFileToS3(uuid, signedUrl, fileContent, taskId, 'StraighterLine')
//   fs.unlinkSync(`/tmp/${fileName}`)
//   if (isSingle) {
//     return true
//   }
// }

// async function closeBrowser (page, context) {
//   await page.close()
//   await context.close()
// }
