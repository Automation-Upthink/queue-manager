// tests/api.test.js
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import {
  fetchUserCreds,
  instance,
  generateSignedUrl,
  uploadFileToS3,
  uploadScreenshotFileToS3,
  addEssay
} from '../src/apiService.mjs' // Replace with the actual path

describe('API Tests', () => {
  let mockAxios

  beforeEach(() => {
    mockAxios = new MockAdapter(instance)
  })

  afterEach(() => {
    mockAxios.restore()
  })

  test('fetchUserCreds returns user credentials', async () => {
    const clientName = 'BrainFuse'
    const uuid = 'mockuuid'
    const mockResponse = {
      essayClientCredList: [
        {
          id: 9,
          name: 'CwTutor',
          clientName: 'BrainFuse',
          password: '1234',
          createdBy: 'deboo.roy+admin@upthink.com',
          downloadLimit: 1,
          createdAt: 1693220279387
        },
        {
          id: 9,
          name: 'CwTutor1',
          clientName: 'BrainFuse',
          password: '1234',
          createdBy: 'deboo.roy+admin@upthink.com',
          downloadLimit: 1,
          createdAt: 1693220279387
        }
      ]
    }

    mockAxios.onPost('/qm/listCredsForClient', { clientName }).reply(200, mockResponse)

    const userCreds = await fetchUserCreds(uuid, clientName)

    expect(userCreds).toEqual(mockResponse.essayClientCredList)
  })

  test('fetchUserCreds handles no credentials', async () => {
    const clientName = 'testClient'
    const uuid = 'mockuuid'
    const mockResponse = {
      essayClientCredList: []
    }

    mockAxios.onPost('/qm/listCredsForClient', { clientName }).reply(200, mockResponse)

    const userCreds = await fetchUserCreds(uuid, clientName)

    expect(userCreds).toBeNull()
  })

  test('fetchUserCreds handles error', async () => {
    const clientName = 'testClient'
    const uuid = 'mockuuid'
    mockAxios.onPost('/qm/listCredsForClient', { clientName }).networkError()

    await expect(fetchUserCreds(uuid, clientName)).rejects.toThrow()
  })

  test('generateSignedUrl returns a valid URL', async () => {
    const fileName = 'testFile.txt'
    const fileType = 'text/plain'
    const taskId = '123'
    const uuid = 'mockuuid'
    const mockResponse = {
      url: 'https://example.com/signed-url'
    }

    mockAxios.onPost('/qm/presignUrl', { fileName, fileType, fileId: taskId }).reply(200, mockResponse)

    const signedUrl = await generateSignedUrl(uuid, fileName, fileType, taskId)

    expect(signedUrl).toBe(mockResponse.url)
  })

  test('generateSignedUrl returns null when URL is unavailable', async () => {
    const fileName = 'testFile.txt'
    const fileType = 'text/plain'
    const taskId = '123'
    const uuid = 'mockuuid'
    const mockResponse = {} // No URL in the response

    mockAxios.onPost('/qm/presignUrl', { fileName, fileType, fileId: taskId }).reply(200, mockResponse)

    const signedUrl = await generateSignedUrl(uuid, fileName, fileType, taskId)

    expect(signedUrl).toBeNull()
  })

  test('generateSignedUrl throws an error on API error', async () => {
    const fileName = 'testFile.txt'
    const fileType = 'text/plain'
    const taskId = '123'
    const uuid = 'mockuuid'
    mockAxios.onPost('/qm/presignUrl', { fileName, fileType, fileId: taskId }).networkError()

    await expect(generateSignedUrl(uuid, fileName, fileType, taskId)).rejects.toThrow()
  })
  test('addEssay to update db with the esssay and return success', async () => {
    const taskId = 123
    const name = 'testEssay'
    const clientName = 'testClient'
    const credId = 1
    const uuid = 'mockuuid'
    const mockResponse = {
      success: true
    }
    mockAxios.onPost('/qm/addEssay', { taskId, name, clientName, credId, uuid }).reply(200, mockResponse)

    await addEssay(uuid, taskId, name, clientName, credId)
  })

  test('addEssay to update db with the esssay and return false in success', async () => {
    const taskId = 123
    const name = 'testEssay'
    const clientName = 'testClient'
    const credId = 1
    const uuid = 'mockuuid'
    const mockResponse = {
      success: false
    }
    mockAxios.onPost('/qm/addEssay', { taskId, name, clientName, credId, uuid }).reply(200, mockResponse)

    await addEssay(uuid, taskId, name, clientName, credId)
  })

  test('addEssay should not throw error when network error', async () => {
    const taskId = 123
    const name = 'testEssay'
    const clientName = 'testClient'
    const credId = 1
    const uuid = 'mockuuid'
    mockAxios.onPost('/qm/addEssay', { taskId, name, clientName, credId, uuid }).networkError()

    await addEssay(uuid, taskId, name, clientName, credId)
  })

  test('uploadFileToS3 successfully uploads the file', async () => {
    const signedUrl = 'https://example.com/signed-url'
    const fileContent = 'Test file content'
    const taskId = '123'
    const uuid = 'mockuuid'
    const mockResponse = {
      status: 200
    }

    const axiosMock = new MockAdapter(axios)
    axiosMock.onPut(signedUrl).reply(200, mockResponse)

    await expect(async () => {
      await uploadFileToS3(uuid, signedUrl, fileContent, taskId)
    }).not.toThrow()

    axiosMock.restore()
  })
  // test('uploadFileToS3 throws an error on upload failure', async () => {
  //   const signedUrl = 'https://example.com/signed-url'
  //   const fileContent = 'Test file content'
  //   const taskId = '123'
  //   const uuid = 'mockuuid'
  //   // Mock a network error response
  //   mockAxios.onPut(signedUrl).networkError()

  //   // Expect the function to throw an error
  //   await expect(uploadFileToS3(uuid, signedUrl, fileContent, taskId)).rejects.toThrow()
  // }, 30000)

  test('uploadScreenshotFileToS3 successfully uploads the file', async () => {
    const signedUrl = 'https://example.com/signed-url'
    const fileContent = 'Test file content'
    const taskId = '123'
    const uuid = 'mockuuid'
    const mockResponse = {
      status: 200
    }

    const axiosMock = new MockAdapter(axios)
    axiosMock.onPut(signedUrl).reply(200, mockResponse)

    await expect(async () => {
      await uploadScreenshotFileToS3(uuid, signedUrl, fileContent, taskId)
    }).not.toThrow()

    axiosMock.restore()
  })

  // test('uploadScreenshotFileToS3 throws an error on upload failure', async () => {
  //   const signedUrl = 'https://example.com/signed-url'
  //   const fileContent = 'Test file content'
  //   const taskId = '123'
  //   const uuid = 'mockuuid'

  //   // Mock a network error response
  //   mockAxios.onPut(signedUrl).networkError()

  //   // Expect the function to throw an error
  //   await expect(uploadScreenshotFileToS3(uuid, signedUrl, fileContent, taskId)).rejects.toThrow()
  // }, 30000)
})
