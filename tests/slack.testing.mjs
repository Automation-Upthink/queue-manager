// slackLog.test.js

// Import the functions to test
// import { slackLog } from '../src/slack.mjs' // Replace 'yourModule' with the actual path to your module.
// import { jest } from '@jest/globals'
// import { WebClient } from '@slack/web-api'
// Mock the WebClient and dotenv modules
// jest.mock('@slack/web-api', () => {
//   const originalModule = jest.requireActual('@slack/web-api')
//   return {
//     ...originalModule,
//     WebClient: jest.fn(() => ({
//       chat: {
//         postMessage: jest.fn()
//       }
//     }))
//   }
// })
// jest.mock('@slack/web-api', () => {
//   const mSlack = {
//     chat: {
//       postMessage: jest.fn()
//     }
//   }
//   return { WebClient: jest.fn(() => mSlack) }
// })

// jest.mock('dotenv', () => ({
//   config: jest.fn()
// }))
// describe('test', () => {
//   const slack = new WebClient()
//   it('tests slack message', async () => {
//     await slackLog('Hello world!', '123')
//     expect(slack.chat.postMessage).toBeCalledWith({ text: 'Hello world!', channel: '123' })
//     // expect(slack.chat.postMessage).toBeCalled()
//   })
// })

// Define your tests
// describe('slackLog function', () => {
// //   let slack = WebClient
//   it('should send a message using WebClient', async () => {
//     const message = 'Test message'
//     const channel = 'test-channel'
//     const slack = new WebClient()

//     await slackLog(message, channel)

//     expect(slack.chat.postMessage).toBeCalledWith({
//       text: message,
//       channel
//     })
//   })

//   //   it('should handle errors', async () => {
//   //     const message = 'Test error message'
//   //     const channel = 'error-channel'

//   //     const { chat } = WebClient.mock.instances[0]
//   //     chat.postMessage.mockRejectedValueOnce({
//   //       code: 'someErrorCode',
//   //       data: 'errorData'
//   //     })

//   //     console.log = jest.fn() // Mock the console.log function

//   //     await slackLog(message, channel)

//   //     expect(chat.postMessage).toHaveBeenCalledWith({
//   //       text: message,
//   //       channel
//   //     })

// //     // Verify that the error was logged
// //     expect(console.log).toHaveBeenCalledWith('Unexpected slack error.', expect.any(Error))
// //   })
// })

// describe('slackLogClient function', () => {
//   it('should call slackLog with the correct channel for BrainFuse client', () => {
//     const message = 'Test message for BrainFuse'
//     const clientName = 'BrainFuse'

//     const { slackLog } = require('./yourModule') // Replace 'yourModule' with the actual path to your module.

//     slackLog(message, jest.fn()) // Mock slackLog function

//     slackLogClient(uuid, message, clientName)

//     expect(slackLog).toHaveBeenCalledWith(message, expect.any(String))
//   })

//   // Add similar test cases for other client names
// })
