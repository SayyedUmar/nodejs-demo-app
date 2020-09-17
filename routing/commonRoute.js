const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const memoDetails = require('../components/common/getMemoDetails')
router.get(`/getMemoDetails`, authenticate, memoDetails.getMemoDetails)

const memoList = require('../components/common/searchMemo')
router.get(`/searchMemo`, authenticate, memoList.searchMemo)

const dashboard = require('../components/common/dashboardForAll')
router.get(`/getDashboardData`, authenticate, dashboard.getDashboardData)

const invoiceInfo = require('../components/common/getInvoiceInfo')
router.get(`/getInvoiceInfo`, authenticate, invoiceInfo.getInvoiceInfo)

module.exports = router