const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const verify = require('../components/commercial/verifyInvoice')
router.post(`/verifyInvoice`, authenticate, verify.verifyInvoice)

const invoiceDetails = require('../components/commercial/getInvoiceDetails')
router.get(`/getInvoiceDetails`, authenticate, invoiceDetails.getInvoiceDetails)

const reject = require('../components/commercial/rejectInvoice')
router.post(`/rejectInvoice`, authenticate, reject.rejectInvoice)

const invoiceFiles = require('../components/commercial/uploadInvoiceFiles')
router.post(`/uploadInvoiceFiles`, upload.array('file', 100), authenticate, invoiceFiles.uploadInvoiceFiles)

const deleteFiles = require('../components/commercial/deleteInvoiceFiles')
router.post(`/deleteInvoiceFiles`, authenticate, deleteFiles.deleteInvoiceFiles)

const reassign = require('../components/commercial/reassign')
router.post(`/reassignMemo`, authenticate, reassign.reassignMemo)

const vendorInvoice = require('../components/commercial/invoicePosting')
router.get(`/invoicePosting`, authenticate, vendorInvoice.invoicePosting)

const verificationByChecker = require('../components/commercial/checkerVerification')
router.post(`/checkerVerification`, authenticate, verificationByChecker.checkerVerification)

const acknowledge = require('../components/commercial/acknowledgeInvoice')
router.post(`/acknowledgeInvoice`, authenticate, acknowledge.acknowledgeInvoice)

const checkerInvoice = require('../components/commercial/invoiceForChecker')
router.get(`/invoiceForChecker`, authenticate, checkerInvoice.invoiceForChecker)

const batchId = require('../components/commercial/searchBatchId')
router.get(`/searchBatchId`, authenticate, batchId.searchBatchId)

const invoicePostingLogs = require('../components/commercial/invoicePostingLogs')
router.get(`/invoicePostingLogs`, authenticate, invoicePostingLogs.invoicePostingLogs)

const advanceDebitNotes = require('../components/commercial/getAdvanceDebitNotes')
router.get(`/fetchAdvanceDebitNotes`, authenticate, advanceDebitNotes.fetchAdvanceDebitNotes)
router.get(`/getAdvanceDebitNotes`, authenticate, advanceDebitNotes.getAdvanceDebitNotes)

const reverseKR = require('../components/commercial/reverseKRFromSAP')
router.post(`/reverseKRFromSAP`, reverseKR.reverseKRFromSAP)

const baDetails = require('../components/commercial/getBaList')
router.get(`/getBaList`, authenticate, baDetails.getBaList)

const paymentDetails = require('../components/commercial/getPaymentRequestDetails')
router.get(`/getPaymentRequestDetails`, authenticate, paymentDetails.getPaymentRequestDetails)

const paymentRequest = require('../components/commercial/createPaymentRequest')
router.post(`/createPaymentRequest`, authenticate, paymentRequest.createPaymentRequest)

const paymentRequestNo = require('../components/commercial/getPaymentRequestNoList')
router.get(`/getPaymentRequestNoList`, authenticate, paymentRequestNo.getPaymentRequestNoList)

const PaymentRequestForReject = require('../components/commercial/getPaymentRequestForReject')
router.get(`/getPaymentRequestForReject`, authenticate, PaymentRequestForReject.getPaymentRequestForReject)

const rejectPayment = require('../components/commercial/rejectPaymentRequest')
router.post(`/rejectPaymentRequest`, authenticate, rejectPayment.rejectPaymentRequest)

const downloadPayment = require('../components/commercial/downloadPaymentRequestExcel')
router.get(`/downloadPaymentRequest`, authenticate, downloadPayment.downloadPaymentRequest)

const openItemsFromSAP = require('../components/commercial/openItemsFromSAP')
router.get(`/openItemsFromSAP`, openItemsFromSAP.openItemsFromSAP)

const reverseKRMail = require('../components/commercial/reverseKRMail')
router.get(`/reverseKRMail`, reverseKRMail.reverseKRMail)
module.exports = router