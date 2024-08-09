// import { WebClient, ErrorCode, LogLevel } from '@slack/web-api'
// import dotenv from 'dotenv'
// dotenv.config()
// // Read a token from the environment variables
// const token = process.env.SLACK_TOKEN
// // let logMessages = []
// // logMessages.push('```')
// // Initialize
// const web = new WebClient(token, {
//   logLevel: LogLevel.ERROR
// })
// const conversationIdNT = process.env.SLACK_CHANNEL_ID_NT
// const conversationIdBF = process.env.SLACK_CHANNEL_ID_BF
// const conversationIdSL = process.env.SLACK_CHANNEL_ID_SL

// export async function slackLog (message, channel) {
//   console.log(message)
//   // logMessages.push(message)
// }
// export async function slackLogClient (uuid, message, clientName) {
//   switch (clientName) {
//     case 'BrainFuse':
//       slackLog(uuid + ' - ' + message, conversationIdBF)
//       break
//     case 'NetTutor':
//       slackLog(uuid + ' - ' + message, conversationIdNT)
//       break
//     case 'StraighterLine':
//       slackLog(uuid + ' - ' + message, conversationIdSL)
//       break
//     default:
//       break
//   }
// }
// export async function slackError (message, channel) {
//   console.log(message)
//   // logMessages.push(message)
//   // logMessages.push('```')
//   try {
//     return await web.chat.postMessage({
//       text: '```' + message + '```',
//       channel
//     })
//     // logMessages = []
//   } catch (error) {
//     // Check the code property, and when its a PlatformError, log the whole response.
//     if (error.code === ErrorCode.PlatformError) {
//       console.log(error.data)
//     } else {
//       // Some other error, oh no!
//       console.log('Unexpectedslack error.', error)
//     }
//   }
// }
// export async function slackLogError (uuid, message, clientName) {
//   switch (clientName) {
//     case 'BrainFuse':
//       slackError(uuid + ' - ' + message, conversationIdBF)
//       break
//     case 'NetTutor':
//       slackError(uuid + ' - ' + message, conversationIdNT)
//       break
//     case 'StraighterLine':
//       slackError(uuid + ' - ' + message, conversationIdSL)
//       break
//     default:
//       break
//   }
// }
