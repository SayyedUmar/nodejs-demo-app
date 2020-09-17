class BillActivity {
    async addLog(dataObj) {
        console.log(dataObj)
        try {
            await db.billActivity
                .create({
                    Bill_Details_ID: dataObj.billDetailsId,
                    Activity_Code: dataObj.activityCode,
                    Activity_Description: dataObj.activityDes,
                    Activity_Time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    Current_Status: dataObj.currStatus,
                    Previous_Status: dataObj.preStatus,
                    Updated_By: dataObj.updatedBy,
                })
            return "done";
        } catch (error) {
            console.log(error)
            return error;
        }
    }
}

const billActivity = new BillActivity()

module.exports.billActivity = billActivity