const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const accVerification = require('../components/accountVerification/getBillsAccounts')
router.get(`/getPendingBillAccounts`, authenticate, accVerification.getBillsAccounts)

const saveAccVerification = require('../components/accountVerification/addAccVerification')
router.post(`/addAccVerification`, authenticate, saveAccVerification.addAccVerification)

router.post(`/resolveInvoice`, authenticate, saveAccVerification.resolveInvoice)

const mergeintoPdf = require('../components/accountVerification/mergeFilesToPDF')
router.post(`/mergeIntoPdf`, authenticate, mergeintoPdf.convertToPdf)

const exportToExcel = require('../components/accountVerification/exportExcelAcc')
router.post(`/exportExcelAcc`, authenticate, exportToExcel.exportToExcelAcc)

module.exports = router