class EmailService {
  async sendEmailViaBH(dataObj) {
    return new Promise((resolve, reject) => {
      try {
        if (process.env.EMAIL_SERVICE == `true`) {
          const EUrl = process.env.BILL_HUB_EMAIL_URL
          let username = 'BA-PORTAL'
          let password = 'rel$ldkxw),0F_}~Ggfd'
          const auth = Buffer.from(username + ':' + password).toString('base64')
          console.log('result', JSON.stringify(dataObj))
          request.post({
            headers: {
              'content-type': `application/json`,
              'Authorization': 'Basic ' + auth
            },
            url: EUrl,
            json: true,
            body: dataObj
          }, (err, ERes, body) => {
            if (err) {
              console.log('errr', err)
              reject(err)
            } else {
              console.log(`body ${body}`)
              console.log(`res`, ERes.statusCode)
              resolve(body)
            }
          })
        } else {
          resolve();
        }
      } catch (error) {
        console.log(`error ${error}`)
        reject(error)
      }
    })
  }
}

const emailServiceCls = new EmailService()

module.exports = {
  emailServiceCls
}