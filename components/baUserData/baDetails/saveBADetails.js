var crypto = require('crypto')
class LoginDetails {

  getTypeBus(fillTypeBus) {

    var TypeBusdata = [{
      value: "Medium"
    }, {
      value: "Small"
    }, {
      value: "Micro"
    }];

    if (TypeBusdata.some(x => x.value == fillTypeBus)) {
      return fillTypeBus;
    } else {
      return "NO";
    }
  }
  async getStateId(regionCode) {
    try {
      let state = await db.state.findOne({
        raw: true,
        where: {
          Region_Code: regionCode
        },
        attributes: ['State_ID']
      })
      return state.State_ID;
    } catch (err) {
      console.log('Error while fetching State details', err)
      return 0;
    }
  }
  async addBAData(dataObj) {
    let errObj = {};
    try {
      var typeBus = this.getTypeBus(dataObj.TYP_BUS);
      var stateID = await this.getStateId(dataObj.REGIO);

      let baIDCreated = await db.ba
        .create({
          ba_code: dataObj.VEN_CODE,
          ba_name: dataObj.NAME,
          state_code: stateID,
          updatedBy: 1,
          updatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
          isActive: 1,
          ba_group_id: dataObj.GROUP_FEATURE,
          is_msmed: typeBus.toString(),
          bank_acc_no: dataObj.BNK_CTY.BankAct,
          ifsc_code: dataObj.BNK_CTY.BankKey,
          bank_name: dataObj.BNK_CTY.BankName
        }).then(result => {
          return result.ba_id
        })

      return errObj = {
        code: 200,
        message: 'BA details added.',
        data: baIDCreated,
        error: ''
      }
    } catch (error) {
      // return Promise.reject(error)
      return errObj = {
        code: 400,
        message: 'Error while inserting BA details',
        error: error
      }
    }
  }
  async updateBAData(dataObj) {
    let errObj = {};
    try {
      var typeBus = this.getTypeBus(dataObj.TYP_BUS);
      var stateID = await this.getStateId(dataObj.REGIO);

      var badetail = await db.ba
        .update({
          ba_name: dataObj.NAME,
          state_code: stateID,
          updatedBy: 1,
          updatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
          isActive: 1,
          ba_group_id: dataObj.GROUP_FEATURE,
          is_msmed: typeBus.toString(),
          bank_acc_no: dataObj.BNK_CTY.BankAct,
          ifsc_code: dataObj.BNK_CTY.BankKey,
          bank_name: dataObj.BNK_CTY.BankName
        }, {
          where: {
            ba_code: dataObj.VEN_CODE,
            ba_group_id: dataObj.GROUP_FEATURE
          }
        })
      return errObj = {
        code: 200,
        message: 'BA details Updated.',
        error: ''
      }

    } catch (error) {
      console.log('Error updating BA', error)
      return errObj = {
        code: 400,
        message: 'Error while updating BA details',
        error: error
      }
      // return Promise.reject(error)
    }
  }
  async addUserData(dataObj) {
    let errObj = {};
    try {

      var mobArr = dataObj.MOB_NO.filter(function (item) {
        return item.MobileNumber_Dept === 'HO';
      });
      var EmailArr = dataObj.EMAIL.filter(function (item) {
        return item.EmailId_Dept === 'HO';
      });

      await db.users
        .create({
          user_name: dataObj.GROUP_FEATURE,
          password: crypto.createHash('md5').update(dataObj.GROUP_FEATURE.toString()).digest("hex"), //dataObj.GROUP_FEATURE,
          token_id: dataObj.GROUP_FEATURE,
          first_name: dataObj.NAME,
          last_name: '',
          role_id: 1,
          created_by: 1,
          created_on: moment().format('YYYY-MM-DD HH:mm:ss'),
          active: 1,
          authToken: 1,
          email_id: (EmailArr.length == 0) ? '' : EmailArr[0].EmailId,
          emailToken: '',
          alternate_emailIDs: '',
          contact_name: dataObj.NAME,
          contact_number: (mobArr.length == 0) ? '' : mobArr[0].MobileNumber
        })
      return errObj = {
        code: 200,
        message: 'User details added.',
        error: ''
      }
    } catch (error) {
      //return Promise.reject(error)
      return errObj = {
        code: 400,
        message: 'Error while inserting user details',
        error: error
      }
    }
  }
  async updateUserData(dataObj) {
    let errObj = {};
    try {
      var mobArr = dataObj.MOB_NO.filter(function (item) {
        return item.MobileNumber_Dept === 'HO';
      });
      var EmailArr = dataObj.EMAIL.filter(function (item) {
        return item.EmailId_Dept === 'HO';
      });

      var userDetail = await db.users
        .update({
          password: crypto.createHash('md5').update(dataObj.GROUP_FEATURE.toString()).digest("hex"),
          token_id: dataObj.GROUP_FEATURE,
          first_name: dataObj.NAME,
          last_name: '',
          role_id: 1,
          updated_by: 1,
          updated_on: moment().format('YYYY-MM-DD HH:mm:ss'),
          active: 1,
          email_id: (EmailArr.length == 0) ? '' : EmailArr[0].EmailId,
          alternate_emailIDs: '',
          contact_name: dataObj.NAME,
          contact_number: (mobArr.length == 0) ? '' : mobArr[0].MobileNumber
        }, {
          where: {
            user_name: (dataObj.GROUP_FEATURE).toString()
          }
        })
      return errObj = {
        code: 200,
        message: 'User details updated.',
        error: ''
      }

    } catch (error) {
      console.log(error)
      return errObj = {
        code: 400,
        message: 'Error while updating User details',
        error: error
      }

      // return Promise.reject(error)
    }
  }
  async getWHTaxID(whTaxType, whTaxCode) {

    let mstdetails = await db.withholding_tax.findAll({
      where: {
        'w/h_tax_type': whTaxType,
        'w/h_tax_code': whTaxCode
      },
      attributes: [
        'tax_rate', ['w/h_id', 'wHID']
      ]
      //    exclude: ['tax_rate', 'w/h_tax_type', 'w/h_tax_code']
      //}
    });

    const results = []

    if (mstdetails) {
      _.forEach(mstdetails, e => {
        let obj = {
          wHID: e.dataValues.wHID
        }
        results.push(obj);
      });
    }
    return results[0].wHID;
  }
  async addConcessiondata(dataObj) {

    let errArr = [];
    let errObj = {};

    if (dataObj.EXEM_NUM.length > 0) {
      for (var i = 0; i < dataObj.EXEM_NUM.length; i++) {

        try {
          let isBaConcessionExist = await db.baConcessionDetails.findOne({
            where: {
              Certificate_No: dataObj.EXEM_NUM[i].ExemNum,
              BA_GROUP_ID: dataObj.GROUP_FEATURE
            }
          })

          if (isBaConcessionExist) {
            var baconcessiondetail = await db.baConcessionDetails
              .update({
                Is_Expired: 1
              }, {
                where: {
                  Certificate_No: dataObj.EXEM_NUM[i].ExemNum,
                  BA_GROUP_ID: dataObj.GROUP_FEATURE
                }
              })
          }
          await db.baConcessionDetails
            .create({
              BA_GROUP_ID: dataObj.GROUP_FEATURE,
              From_Date: moment((dataObj.EXEM_NUM[i].ExemFrom).toString()).format('YYYY-MM-DD'), // moment(dataObj.EXEM_NUM[i].ExemFrom, 'DDMMYYYY').format('YYYY-MM-DD HH:mm:ss'),
              To_Date: moment((dataObj.EXEM_NUM[i].Exem_To).toString()).format('YYYY-MM-DD'), //moment(dataObj.EXEM_NUM[i].Exem_To, 'DDMMYYYY').format('YYYY-MM-DD HH:mm:ss'),
              Concession_Rate: dataObj.EXEM_NUM[i].ExemRate,
              Limit: dataObj.EXEM_NUM[i].Exmp_Limit,
              Withholding_Tax_ID: await this.getWHTaxID(dataObj.EXEM_NUM[i].W_TaxType, dataObj.EXEM_NUM[i].W_TaxCode),
              Current_Value: 0,
              Updated_By: 1,
              Updated_On: moment().format('YYYY-MM-DD HH:mm:ss'),
              Certificate_No: dataObj.EXEM_NUM[i].ExemNum,
              Is_Expired: 0
            })

          errObj = {
            code: 200,
            status: 'success',
            Certificate_No: dataObj.EXEM_NUM[i].ExemNum,
            message: 'BA Concession details added.',
            error: ''
          }
        } catch (error) {
          console.log(error);
          errObj = {
            code: 400,
            status: 'fail',
            Certificate_No: dataObj.EXEM_NUM[i].ExemNum,
            message: 'Error while inserting Concession details',
            error: error
          }
        }
        errArr.push(errObj);
      }
    }
    return errArr;
  }
  async addWHTaxMappingdata(dataObj) {

    let errArr = [];
    let errObj = {};

    if (dataObj.WITH_TYP.length > 0) {
      for (var i = 0; i < dataObj.WITH_TYP.length; i++) {

        try {

          let isWHTaxTypeExist = await db.baWHTaxMapping.findOne({
            where: {
              WH_Tax_ID: await this.getWHTaxID(dataObj.WITH_TYP[i].With_Type, dataObj.WITH_TYP[i].With_Code), // dataObj.WITH_TYP[i].With_Code,
              Ba_Group_ID: dataObj.GROUP_FEATURE
            }
          })

          if (isWHTaxTypeExist) {
            var WHTAxMapping = await db.baWHTaxMapping
              .update({
                Is_Active: 0
              }, {
                where: {
                  WH_Tax_ID: await this.getWHTaxID(dataObj.WITH_TYP[i].With_Type, dataObj.WITH_TYP[i].With_Code), //dataObj.WITH_TYP[i].With_Code,
                  Ba_Group_ID: dataObj.GROUP_FEATURE
                }
              })
          }

          await db.baWHTaxMapping
            .create({
              Ba_Group_ID: dataObj.GROUP_FEATURE,
              WH_Tax_ID: await this.getWHTaxID(dataObj.WITH_TYP[i].With_Type, dataObj.WITH_TYP[i].With_Code),
              Updated_By: 1,
              Updated_On: moment().format('YYYY-MM-DD HH:mm:ss'),
              Is_Active: 1
            })

          errObj = {
            code: 200,
            status: 'success',
            Ba_Group_ID: dataObj.GROUP_FEATURE,
            WH_Tax_ID: await this.getWHTaxID(dataObj.WITH_TYP[i].With_Type, dataObj.WITH_TYP[i].With_Code),

            message: 'WH Tax mapping details added.',
            error: ''
          }
        } catch (error) {
          console.log(error);
          errObj = {
            code: 400,
            status: 'fail',
            Ba_Group_ID: dataObj.GROUP_FEATURE,
            WH_Tax_ID: await this.getWHTaxID(dataObj.WITH_TYP[i].With_Type, dataObj.WITH_TYP[i].With_Code),
            message: 'Error while inserting WH-Tax-mappings',
            error: error
          }
        }
        errArr.push(errObj);
      }
    }
    return errArr;
  }
}
const saveOrUpdateBADetails = async (req, res) => {
  try {

    let objLoginDetails = new LoginDetails()

    if (req.body.length <= 0) {
      res.status(200).send(apiResponse.errorFormat(`fail`, `No Data Found in request`, {}, []));
      return;
    }
    let errValMsg = [];

    for (var i = 0; i < req.body.length; i++) {

      let arr = {}
      console.log('For Loop Started i', i);

      let reqObj = req.body[i];

      arr.VEN_CODE = reqObj.VEN_CODE;
      arr.GROUP_FEATURE = reqObj.GROUP_FEATURE;

      let isBACodeExists = await db.ba.findOne({
        where: {
          ba_code: reqObj.VEN_CODE,
          ba_group_id: (reqObj.GROUP_FEATURE).toString()
        },
        attributes: ["ba_id"]
      })
      let isUserExists = await db.users.findOne({
        where: {
          user_name: (reqObj.GROUP_FEATURE).toString()
        }
      })
      var errMsg = '';
      let baArr = {};
      let userArr = {};
      console.log('IsEs--------------------------->', isBACodeExists)
      if (isBACodeExists) {
        console.log('true--------------------->')
        baArr = await objLoginDetails.updateBAData(reqObj)
      } else {
        console.log('false--------------------->')
        baArr = await objLoginDetails.addBAData(reqObj)
      }
      if (baArr.code === 200) {
        errMsg = errMsg + baArr.message;

        if (isUserExists) {
          userArr = await objLoginDetails.updateUserData(reqObj)
        } else {
          userArr = await objLoginDetails.addUserData(reqObj)
        }
        errMsg = errMsg + userArr.message;
        arr.APP_ID = (isBACodeExists) ? isBACodeExists.ba_id : baArr.data
        if (userArr.code == 200) { //--------- Exem/Concession & WithType S--------//      
          try {
            var concessArr = await objLoginDetails.addConcessiondata(reqObj)
            var withHoldArr = await objLoginDetails.addWHTaxMappingdata(reqObj)

          } catch (error) {

          }
          //--------- Exem/Concession & WithType E--------// 
        }
      } else {
        errMsg = errMsg + baArr.message;
      }
      arr.message = errMsg;

      let errArr = [];
      if (baArr.code == 400) {
        let arr = {
          code: baArr.code,
          message: baArr.message
        };
        errArr.push(arr)
      }

      if (userArr.code == 400) {
        let arr = {
          code: userArr.code,
          message: userArr.message
        }
        errArr.push(arr)
      }

      if (baArr.code == 200 && userArr.code == 200) {
        arr.status = 'success';
      } else {
        arr.status = 'fail';
        arr.error = errArr;
      }
      errValMsg.push(arr);

    }
    res.status(200).send(apiResponse.successFormat(`success`, `Data Processed`, errValMsg, []))

  } catch (error) {
    console.log('error - ', error)
    const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
    const response = errorResponse(error)
    res.status(code).send(response)
  }
}
module.exports = {
  saveOrUpdateBADetails
}