import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import dotenv from 'dotenv'
import { slackLog } from './slack.mjs'
import moment from 'moment'
dotenv.config()

async function authenticateSheet () {
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

  const jwt = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: SCOPES
  })

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt)
  await doc.loadInfo()
  return doc
}
export async function writeToGSheet (clientName, cred, count) {
  try {
    const doc = await authenticateSheet()
    const sheet = doc.sheetsByTitle.Daily_Queue_Count

    const currentDate = moment() // Create a Moment object with the current date and time
    const formattedDate = currentDate.format('MM/DD/YYYY, h:mm:ss A')
    // append rows
    slackLog(
      'Writing data to google sheet for client ' +
        clientName +
        ' cred ' +
        cred +
        ' count ' +
        count +
        ' time ' +
        formattedDate
    )
    await sheet.addRow({ Client: clientName, Cred: cred, Count: count, CheckedAt: formattedDate })
  } catch (error) {
    slackLog('Caught an error while writing to sheet ' + error)
  }
}

export async function loadCredsFromSheet () {
  try {
    const doc = await authenticateSheet()

    // Access the specific sheet by its index (0 for the first sheet)
    const sheet = doc.sheetsByTitle.Queue_Count_Creds

    // Load all rows from the sheet
    const rows = await sheet.getRows()

    // Initialize the final JSON array
    const jsonData = []

    // Iterate through the rows and format the data
    let currentClient = null
    for (const row of rows) {
      const clientName = row.get('ClientName')
      const name = row.get('Name')
      const password = row.get('Password')
      // Check if this row belongs to the current client or a new one
      if (currentClient === null || currentClient.clientName !== clientName) {
        // Start a new client object
        currentClient = {
          clientName,
          creds: []
        }
        jsonData.push(currentClient)
      }

      // Add credentials to the current client's 'creds' array
      currentClient.creds.push({
        name,
        password
      })
    }

    console.log('Data from Google Sheet in the desired format:')
    JSON.stringify(jsonData, null, 2)
    return jsonData
  } catch (err) {
    console.error('Error reading from Google Sheet:', err)
  }
}
