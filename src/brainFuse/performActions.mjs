import { generateSignedUrl, uploadFileToS3, uploadScreenshotFileToS3, addEssay } from '../apiService.mjs'
import fs from 'fs'
import path from 'path'
// import { slackLogClient } from '../slack.mjs'

// const slackClientName = 'BrainFuse'
// return true if only single essay is downloaded, return false in all failure cases , empty return when success and to proceed further
export async function performActionBrainFuse (uuid, user, browser, isSingle) {
  if (user.downloadLimit > 0 && user.downloadRemaining > 0) {
    const context = await browser.newContext()
    const page = await context.newPage()

    // login user
    const loginError = await loginUser(page, user)
    if (loginError) {
      // slackLogClient(uuid, 'login error', slackClientName)
      await context.close()
      return false
    }

    const visible = await checkEssays(page)
    // slackLogClient(uuid, 'Essays available - ' + visible, slackClientName)

    // proceed with further logic if essays are available
    const essayAccepted = await browseEssays(uuid, page, context, user, isSingle)
    await page.close()
    await context.close()
    return essayAccepted
  } else {
    // slackLogClient(uuid, 'Download limit exceeded or user ' + user.name, slackClientName)
    return false
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
  await page.waitForLoadState('networkidle')
  return await page.locator('.pg-login .errMsg').isVisible()
}

export async function checkEssays (page) {
  // check if essays are avialable for the user
  await page.locator('.inbox-error-msg').isHidden()
  await page.waitForSelector('.loader-container', { state: 'hidden' })

  await page.locator('.inbox-error-msg').isHidden()
  return await page.locator('.inbox-error-msg').isVisible()
}

export async function browseEssays (uuid, page, context, user, isSingle) {
  const essayListTableRows = page.locator('#inboxTable tbody')
  const tableRowCount = await essayListTableRows.evaluate((tableBody) => {
    return tableBody.querySelectorAll('tr').length
  })

  // slackLogClient(uuid, 'Total essays count ' + tableRowCount, slackClientName)
  if (tableRowCount <= 0) {
    slackLogClient(uuid, 'no essays present', slackClientName)
    await page.close()
    return false
  }

  let acceptedCount = 0
  // slackLogClient(uuid, 'starting the essay clicks', slackClientName)
  for (let i = 0; i < tableRowCount; i++) {
    const availableDownloads = user.downloadLimit - acceptedCount
    if (availableDownloads <= 0) {
      return
    }
    // click and open essay --start
    const essay = essayListTableRows.locator('tr').nth(i).locator('td').nth(1)
    // slackLogClient(uuid, 'Opening task ' + (await essay.innerText()), slackClientName)

    await essay.click()
    await page.waitForSelector('iframe')

    const iframeElement = await page.$('iframe')
    // Get the src attribute of the iframe
    const src = await iframeElement.evaluate((iframe) => iframe.src)
    // open essay in new page with the iframe src
    const newPage = await context.newPage()
    await newPage.goto(src)
    await newPage.waitForLoadState('networkidle')
    // check if essay is present or no
    const tableLocator = newPage.locator('table').first()
    await tableLocator.waitFor()
    const pageContent = await tableLocator.isVisible()
    // click and open essay --end

    // if the essay is opened and content is not visible
    // we will stop going further and return
    if (!pageContent) {
      // slackLogClient(uuid, 'The essay is no longer available or something is wrong.', slackClientName)
      await newPage.close()
      await page.getByTitle('Go Back').click()
      continue
    }
    // if the essay is opened and content is visible
    // check if the essay is accepted already if not download and accept it
    // const accepted = await newPage.locator('#new-review').isVisible()
    // slackLogClient(uuid, 'Is accepted - ' + accepted, slackClientName)

    // if the essay is aleardy accepted we will increment accepted count and return
    // if (accepted) {
    //   acceptedCount++
    //   slackLogClient(uuid, 'The essay is already accepted', slackClientName)
    //   await newPage.close()
    //   await page.getByTitle('Go Back').click()
    //   continue
    // }

    // proceed only if essay is not already accepted
    const tableRows = tableLocator.locator('tr')
    const tableRowCount = await tableRows.count()
    let taskId, essayDueDate
    for (let i = 0; i < tableRowCount; i++) {
      const td = tableRows.nth(i).locator('td')
      const tableData = await td.nth(0).innerText()
      if (tableData === 'Task ID') {
        taskId = await td.nth(1).innerText()
        // slackLogClient(uuid, 'Processing essay for task id - ' + taskId, slackClientName)
      }
      try {
        if (tableData === 'Due Date') {
          essayDueDate = await td.nth(1).innerText()
        }
      } catch (error) {
        // slackLogClient(uuid, 'Error while getting dueDate for - ' + taskId, slackClientName)
        continue
      }
      if (tableData === 'Uploaded Doc.') {
        // only download essays as per the download limit
        // keep checking the download remaining and download limit
        // availableDownloads is more then 0 , download essay
        const response = await downloadAndAcceptEssay(
          uuid,
          newPage,
          page,
          td,
          taskId,
          user,
          acceptedCount,
          essayDueDate
        )
        if (response.break) {
          return
        }
        acceptedCount = response.acceptedCount
        if (isSingle && response.essayAccepted) {
          return true
        }
        break
      }
    }
  }
}

// send true from downloadEssay to break the loop in which this function is called
export async function downloadAndAcceptEssay (uuid, newPage, page, td, taskId, user, acceptedCount, essayDueDate) {
  let fileName, response
  // download essay
  let downloadPromise
  try {
    if (await td.nth(1).locator('a').isVisible()) {
      const downloadedFileName = await td.nth(1).innerText()
      const fileParts = path.parse(downloadedFileName)

      // Combine the file name and ID (before the extension)
      fileName = `${fileParts.name}_${taskId}${fileParts.ext}`

      if (!isValidFormat(fileName)) {
        // slackLogClient(uuid, 'Format not supported', slackClientName)
        await newPage.close()
        await page.getByTitle('Go Back').click()
        // this means essay was not accepted no need to increment the acceptedessay count
        response = {
          acceptedCount,
          essayAccepted: false,
          break: false
        }
        return response
      }
      // slackLogClient(uuid, 'Downloading essay for task -' + taskId, slackClientName)
      downloadPromise = newPage.waitForEvent('download')
      td.nth(1).locator('a').click()
      const download = await downloadPromise
      await download.saveAs(`/tmp/${fileName}`)

      // uncomment below code to start accepting essays
      // accept essay
      await newPage.getByRole('button', { name: 'Accept' }).click()

      // check if progress bar is visible
      let visible = await newPage.locator('#divPopupProgress').isVisible()
      // slackLogClient(uuid, 'prog bar hidden ' + visible, slackClientName)

      // check if pBar is hidden
      visible = await newPage.locator('#divPopupProgress').isVisible()
      // slackLogClient(uuid, 'prog bar vis ' + visible, slackClientName)

      // check if there is no error message
      await newPage.waitForTimeout(2500)
      const limitErrVis = await newPage.locator('#divPopupBodyCont h3 font').isVisible()
      // slackLogClient(uuid, 'limit error visible ' + limitErrVis, slackClientName)
      const errMsgVis = await newPage.locator('#divPopupBodyCont ul span').isVisible()
      // slackLogClient(uuid, 'errMsgVis ' + errMsgVis, slackClientName)

      if (errMsgVis) {
        fs.unlinkSync(`/tmp/${fileName}`)
        const errorText = await newPage.locator('#divPopupBodyCont ul span').innerText()
        if (errorText.includes('You have exceeded your limit ')) {
          // something went wrong while accpeting the essay
          // slackLogClient(uuid, 'failed to accept the essay reason your download limit exceeded', slackClientName)
          return {
            break: true
          }
        }
        // slackLogClient(uuid, 'failed to accept the essay reason ' + errorText, slackClientName)
        // this means essay accept failed, dont increment acceptedessay count
        response = {
          acceptedCount,
          essayAccepted: false,
          break: false
        }
      } else {
        // essay was accepted
        // update the db
        await addEssay(uuid, taskId, fileName, user, essayDueDate)
        // await page.waitForTimeout(1500)
        // upload the essay file to our server
        // now generate signedUrl
        // const signedUrl = await generateSignedUrl(uuid, fileName, 'file', taskId, slackClientName)
        // upload the file to s3
        const fileContent = fs.readFileSync(`/tmp/${fileName}`)
        // await uploadFileToS3(uuid, signedUrl, fileContent, taskId, slackClientName)
        fs.unlinkSync(`/tmp/${fileName}`)
        // upload screenshot to s3
        // take screenshot
        const screenshotName = taskId + '_details.png'
        await newPage.setViewportSize({ width: 1920, height: 1920 })
        await newPage.screenshot({
          path: `/tmp/${screenshotName}`,
          fullPage: true
        })

        // get signed url for screenshot
        // const ssSignedUrl = await generateSignedUrl(uuid, screenshotName, 'screenshot', taskId, slackClientName)

        // upload the file to s3
        const ssFileContent = fs.readFileSync(`/tmp/${screenshotName}`)
        // await uploadScreenshotFileToS3(uuid, ssSignedUrl, ssFileContent, taskId, slackClientName)
        fs.unlinkSync(`/tmp/${screenshotName}`)

        // this means essay was accepted now increment the acceptedessay count
        response = {
          acceptedCount: ++acceptedCount,
          essayAccepted: true,
          break: false
        }
      }
      // till here
      await newPage.close()
      // now click back button
      await page.getByTitle('Go Back').click()
      return response
    } else {
      slackLogClient(uuid, 'No essay link', slackClientName)
      await newPage.close()
      await page.getByTitle('Go Back').click()
      // this means essay was not accepted no need to increment the acceptedessay count
      response = {
        acceptedCount,
        essayAccepted: false,
        break: false
      }
      return response
    }
  } catch (error) {
    slackLogClient(uuid, 'Something went wrong ' + error, slackClientName)
  }
}

export function isValidFormat (fileName) {
  const acceptedExtensions = ['.doc', '.docx', '.pdf', '.rtf', '.pptx']
  const fileExtension = fileName.slice(fileName.lastIndexOf('.'))

  return acceptedExtensions.includes(fileExtension.toLowerCase())
}
