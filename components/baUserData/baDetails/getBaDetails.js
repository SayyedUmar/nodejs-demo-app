const getBaData = async (req, res) => {
  try {
    console.log(req.body);
    let badetails = await db.ba.findAll({
      where: {
        //is_active: 1
      },
      attributes: {
        exclude: ['created_by', 'updated_by', 'created_on', 'updated_on']
      }
    })
    console.log(badetails)
    const results = []
    if (badetails) {
      _.forEach(badetails, e => {
        let obj = {
          baId: e.dataValues.ba_id,
          baCode: e.dataValues.ba_code,
          baName: e.dataValues.ba_name,
          stateCode: e.dataValues.state_code,
          isActive: e.dataValues.isActive,
          tradeDiscount: e.dataValues.tradeDiscount,
          creditPeriod: e.dataValues.credit_Period,
          tdCreditPeriod: e.dataValues.td_Credit_Period,
          baGroupId: e.dataValues.ba_group_id,
          isMsmed: e.dataValues.is_msmed
        }
        results.push(obj)
      })
      res.status(200).send(apiResponse.successFormat(`success`, `Ba data fectched successfully`, results, []))
    } else {
      res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
    }
  } catch (error) {
    console.log(`something went wrong ${JSON.stringify(error)}`)
    let errorResponse = {}
    let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500

    if (Object.prototype.hasOwnProperty.call(error, 'status')) {
      errorResponse = error
      errorResponse = _.omit(errorResponse, ['code'])
    } else {
      console.log(error);
      errorResponse = {
        status: 'fail',
        message: 'Something went wrong',
        data: {},
        error: [{
          code: 'err_001',
          message: errorCode.err_001
        }]
      }
    }

    res.status(code).send(errorResponse)
  }
}

module.exports.getBaData = getBaData