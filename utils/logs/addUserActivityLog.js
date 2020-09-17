class UserActivityLog {
    async addLog(dataObj) {
        try {
            await db.userActivityLog
                .create({
                    Activity_Name: dataObj.activityName,
                    Time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    Details: dataObj.details,
                    Old_Value: dataObj.oldValue,
                    New_Value: dataObj.newValue,
                    User_ID: dataObj.userId,
                })
            return "done";
        } catch (error) {
            console.log(error)
            return error;
        }
    }
}

const userActivityLog = new UserActivityLog()

module.exports.userActivityLog = userActivityLog