import axios from 'axios'
import dotenv from 'dotenv'
// import { slackLogClient, slackLogError } from './slack.mjs'
dotenv.config()

export const instance = axios.create({
  baseURL: process.env.BASE_URL,
  // baseURL: 'https://demo.upthink.com/api/',
  timeout: 15000
})

const maxRetries = 3
const retryDelay = 1000

async function retryRequest (uuid, requestFunction, clientName) {
  let retries = 0
  while (retries < maxRetries) {
    try {
      const response = await requestFunction(clientName)
      return response
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        // await slackLogError(uuid, `Request failed, ${maxRetries - retries} retries left`, clientName)
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        retries++
      } else {
        // await slackLogError(uuid, error, clientName)
        throw error // Throw if it's not a timeout error
      }
    }
  }
  // await slackLogError(uuid, 'Request failed after retries', clientName)
  throw new Error('Request failed after retries')
}

export async function fetchUserCreds (uuid, clientName) {
  return retryRequest(
    uuid,
    async () => {
      const response = await instance.post('/qm/listCredsForClient', { clientName })
      if (response.data.essayClientCredList && response.data.essayClientCredList.length > 0) {
        return response.data.essayClientCredList
      } else {
        // await slackLogError(uuid, 'Unable to get creds', clientName)
        return null
      }
    },
    clientName
  )
}

export async function generateSignedUrl (uuid, fileName, fileType, taskId, clientName) {
  return retryRequest(
    uuid,
    async () => {
      let generatedUrl
      const response = await instance.post('/qm/presignUrl', {
        fileName,
        fileType,
        fileId: taskId
      })
      // set first user creds for now
      if (response.data.url) {
        generatedUrl = response.data.url
      } else {
        // await slackLogError(uuid, 'Unable to get url', clientName)
        generatedUrl = null
      }
      return generatedUrl
    },
    clientName
  )
}

export async function uploadFileToS3 (uuid, signedUrl, fileContent, taskId, clientName) {
  return retryRequest(
    uuid,
    async () => {
      const response = await axios.put(signedUrl, fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })
      if (response) {
        // slackLogClient(
        //   uuid,
        //   'Response after upload file for task ' + taskId + ' with resp ' + response.status,
        //   clientName
        // )
      }
    },
    clientName
  )
}

export async function uploadScreenshotFileToS3 (uuid, signedUrl, fileContent, taskId, clientName) {
  return retryRequest(
    uuid,
    async () => {
      const response = await axios.put(signedUrl, fileContent, {
        headers: {
          'Content-Type': 'image/png'
        }
      })
      if (response) {
        // slackLogClient(
        //   uuid,
        //   'Response after upload file for task ' + taskId + ' with resp ' + response.status,
        //   clientName
        // )
      }
    },
    clientName
  )
}

export async function addEssay (uuid, taskId, filename, user, dueDate = null) {
  await instance
    .post('/qm/addEssay', {
      taskId,
      name: filename,
      clientName: user.clientName,
      credId: user.id,
      uuid,
      dueDate
    })
    .then(async function (response) {
      // set first user creds for now
      if (response.data.success) {
        // await slackLogError(
        //   uuid,
        //   `Task ${taskId}, accepted and updated in db for user - ${user.name} `,
        //   user.clientName
        // )
      } else {
        // await slackLogError(
        //   uuid,
        //   `Error while updating task ${taskId} in db for user - ${user.name} ` + response.data.error,
        //   user.clientName
        // )
      }
    })
    .catch(async function (error) {
      // await slackLogError(
      //   uuid,
      //   `Error while adding essay id ${taskId}, for user - ${user.name}, error - ${error}`,
      //   user.clientName
      // )
      // eslint-disable-next-line eqeqeq
      if (!error.code == 'ECONNABORTED') {
        throw error
      }
    })
}
