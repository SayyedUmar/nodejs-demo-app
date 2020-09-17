class CommonFunc {
    async getFiscalYear() {
        try {
            var now = moment();
            var monVal = now.format('MM');
            var StartDate, EndDate;
            var today = new Date();

            if (monVal > 3) {
                var dt1 = today.getFullYear() + '/04/01';
                var dt2 = (today.getFullYear() + 1) + '/03/31';

                StartDate = moment(new Date(dt1)).format('YYYY/MM/DD')
                EndDate = moment(new Date(dt2)).format('YYYY/MM/DD')
            } else {
                var dt1 = (today.getFullYear() - 1) + '/04/01';
                var dt2 = today.getFullYear() + '/03/31';

                StartDate = moment(new Date(dt1)).format('YYYY/MM/DD')
                EndDate = moment(new Date(dt2)).format('YYYY/MM/DD')
            }
            var result = {
                startDate: StartDate,
                endDate: EndDate
            }
            //console.log('result', result)
            return result;
        } catch (error) {
            throw error;
        }
    }
    async getStateName(stateCode) {
        try {
            let state = await db.state.findOne({
                where: {
                    State_ID: stateCode
                },
                attributes: ['State_Name']
            })
            return state;
        } catch (error) {
            console.log(error)
            return null;
            //throw error;
        }
    }
    async getInvoiceStatus(statusCode) {
        var status = '';
        switch (statusCode) {
            case 'C':
                status = 'Rejected'
                break;
            case 'R':
                status = 'Requested'
                break;
            case 'P':
                status = 'Payment'
                break;
            case 'S':
                status = 'Submitted'
                break;
            case 'B':
                status = 'Booked'
                break;
            case 'A':
                status = 'Acknowledged'
                break;
            case 'V':
                status = 'Verified'
                break;
            default:
                status = ''
        }
        return status;
    }
    async getServiceID(ServiceName) {
        try {
            let serviceCat = await db.serviceCategory.findOne({
                where: {
                    Service_Name: ServiceName
                },
                attributes: ['Service_ID']
            })
            return serviceCat.dataValues.Service_ID;
        } catch (error) {
            console.log(error)
            return null;
            //throw error;
        }
    }
    async getTotalAmt(dataObj) {
        try {
            let totalAmt = 0;
            totalAmt = (dataObj.igst + dataObj.cgst + dataObj.sgst + dataObj.baseAmount + dataObj.additionalAmount - dataObj.tradeDiscount)
            return totalAmt;
        } catch (error) {
            console.log(error)
            return 0;
        }
    }
    async getBAUniqueCode(baId) {
        try {
            let baCode = await db.ba.findOne({
                where: {
                    ba_id: baId
                },
                attributes: ['ba_code']
            })
            return baCode.dataValues.ba_code;
        } catch (error) {
            console.log(error)
            return null;
            //throw error;
        }
    }
    async converToNumber(value) {
        let newValue = 0;
        if (typeof (value) != 'number') {
            if (value != null && value != '' && (!isNaN(value))) {
                newValue = parseFloat(value);
            }
        } else
            newValue = parseFloat(value);
        return newValue;
    }
}
module.exports = CommonFunc