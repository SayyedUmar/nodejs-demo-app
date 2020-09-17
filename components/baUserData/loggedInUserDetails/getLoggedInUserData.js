const serveiceType = require(`../loggedInUserDetails/getServiceType`)
class LoggedInBaData {

  async GetToStateData() {
    let errObj = {};
    try {
      let statedetails = await db.state.findAll({
        where: {
          IsActive: 1
        },
        attributes: {
          exclude: ['IsActive', 'UpdatedBy', 'Plant_code', 'UpdatedOn', 'IsUT']
        }
      })

      const results = []
      if (statedetails) {
        _.forEach(statedetails, e => {
          let obj = {
            State_ID: e.dataValues.State_ID,
            State_code: e.dataValues.State_code,
            State_Name: e.dataValues.State_Name
          }
          results.push(obj)
        })
      }
      return results;
    } catch (error) {
      throw error;
    }
  }

  async GetFromStateData(userID) {

    const results = []
    await db.sequelize.query(`CALL SP_GetFromStateData(:userID)`, {
        replacements: {
          userID
        }
      })
      .then(response => {
        if (response.length > 0) {

          if (response) {
            _.forEach(response, e => {
              let obj = {
                State_ID: e.State_ID,
                State_code: e.State_code,
                State_Name: e.State_Name,
                Ba_Code: e.ba_id
              }
              results.push(obj)
            })
          }
        } else {
          const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
          }
          return errorObj;
        }
      })
      .catch(() => {
        const errorObj = {
          code: `err_001`,
          message: errorCode.err_001
        }
        return errorObj;
      })
    return results;
  }
}
const GetLoggedUserData = async (req, res) => {
  try {

    const userid = req.params.userId
    let objLoggedInBaData = new LoggedInBaData()

    let fromStates = await objLoggedInBaData.GetFromStateData(userid)
    let toStates = await objLoggedInBaData.GetToStateData()
    let serviceType = await serveiceType.getAllServiceType()

    data = {
      fromStateData: fromStates,
      toStateData: toStates,
      serviceTypeData: serviceType,
      currentDate: moment().format('YYYY-MM-DD')
    }
    res.status(200).send(apiResponse.successFormat(`success`, `Data Success`, data, []))
  } catch (error) {
    console.log(error)
    res.status(400).send(apiResponse.errorFormat(`fail`, `Data Failed`, error, []))
  }
}
module.exports = {
  GetLoggedUserData
}