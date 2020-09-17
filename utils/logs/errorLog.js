class ErrorLog {
    async addLog(dataObj) {
        try {
            await db.errorLog
                .create({
                    Error_Code: dataObj.errorCode,
                    Error_Message: dataObj.errorMessage,
                    Time_Of_Error: moment().format('YYYY-MM-DD HH:mm:ss'),
                    InnerException: dataObj.innerException,
                    Stack_Trace: dataObj.stackTrace
                })
            return "done";
        } catch (error) {
            return error;
        }
    }
}

const errorLog = new ErrorLog()

module.exports.errorLog = errorLog