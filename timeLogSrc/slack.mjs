import { WebClient, ErrorCode, LogLevel } from '@slack/web-api'
import dotenv from 'dotenv'
dotenv.config()
// Read a token from the environment variables
const token = process.env.SLACK_TOKEN

// Initialize
const web = new WebClient(token, {
  logLevel: LogLevel.ERROR
})

export async function slackLog (message) {
  console.log(message)
  try {
    return await web.chat.postMessage({
      text: message,
      channel: process.env.SLACK_TIME_LOG_CHANNEL_ID
    })
  } catch (error) {
    // Check the code property, and when its a PlatformError, log the whole response.
    if (error.code === ErrorCode.PlatformError) {
      console.log(error.data)
    } else {
      // Some other error, oh no!
      console.log('Unexpectedslack error.', error)
    }
  }
}
