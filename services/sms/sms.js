const request = require('request')

class SMS {
  async sendSms (data) {
    const userMobile = data.userMobile
    const text = data.text
    const APIurl = `http://mahindrasms.com:8080/mConnector/dispatchapi?cname=mnmlog&tname=mnmlog&login=mnmlog&to=${userMobile}&text=${text}`

    try {
      let smsResponse = await request(APIurl)
      return smsResponse
    } catch (error) {
      return error
    }
  }
}

const sms = new SMS()

module.exports = {
  sendSms: sms.sendSms
}
