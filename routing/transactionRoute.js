const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const draftMemo = require('../components/memoData/getDraftMemoList')
router.get(`/getDraftMemoList`, authenticate, draftMemo.getDraftMemoData.getDraftMemoList)
router.get(`/getDraftMemoDetails`, authenticate, draftMemo.getDraftMemoData.getDraftMemoDetails)
router.get(`/chekDraftExist`, authenticate, draftMemo.getDraftMemoData.checkDraftExists)

const isInvExist = require('../components/checkInvExist')
router.get(`/checkInvoiceExists`, authenticate, isInvExist.checkInvoiceExist)

const clearDraft = require('../components/memoData/deleteDraftDetails')
router.post(`/deleteDraft`, authenticate, clearDraft.deleteDraftData.deleteDraft)
router.post(`/deleteDraftBillByID`, authenticate, clearDraft.deleteDraftData.deleteDraftByID)

const saveDraft = require('../components/memoData/saveDraftDetails')
router.post(`/saveDraftInvoice`, authenticate, saveDraft.saveDraft)

const baLR = require('../components/lrData/getBaseTransactions')
router.get(`/searchBaseTransactions`, authenticate, baLR.getBaseTransactions)

const lrData = require('../components/lrData/getLRData')
router.get(`/getDraftInvoiceLRDetails`, authenticate, lrData.getLRData.getDraftLRData)
router.get(`/getInvoiceLRDetails`, authenticate, lrData.getLRData.getBillLRData)

const validateInvExcel = require('../components/memoData/validateInvoiceExcel')
router.post(`/validateInvoiceExcel`, upload.single(`file`), authenticate, validateInvExcel.validateExcelFromTemplate)
router.post(`/baInvoiceTemplate`, authenticate, validateInvExcel.createTemplateOfLR)

const exportBaseTrans = require('../components/lrData/exportBaseTransactions')
router.post(`/exportBaseTransactions`, authenticate, exportBaseTrans.exportBaseTransactions)

const getBAMemo = require('../components/memoData/getBAMemoDetails')
router.get(`/getBAMemoDetails`, authenticate, getBAMemo.getBAMemoDetails)

const uploadBafiles = require('../components/memoData/uploadBAInvoiceFiles')
router.post(`/uploadBafiles`, upload.single(`file`), authenticate, uploadBafiles.uploadBAInvoiceFiles)
router.post(`/deleteDraftFile`, authenticate, uploadBafiles.deleteSingleDraftFile)

const invAttachments = require('../components/memoData/getInvoiceAttachments')
router.get(`/getInvAttachment`, authenticate, invAttachments.getInvoiceAttachments)

const draftMemoReview = require('../components/memoData/getDraftMemoReview')
router.get(`/getDraftFinalReview`, authenticate, draftMemoReview.getDraftMemoReview)

const draftInvFiles = require('../components/memoData/getDrafteFileDetails')
router.get(`/getDraftFileDetails`, authenticate, draftInvFiles.getDraftFiles)

const saveMemo = require('../components/memoData/saveMemoDetails')
router.post(`/saveMemo`, authenticate, saveMemo.saveMemoDetails)

const sapPaymentDetails = require('../services/advanceDebitNotes/advanceDebitScheduler')
router.post(`/scheduler-adv-debit`, sapPaymentDetails.paymentDetails)

const invData = require('../components/memoData/getBAInvDetails')
router.get(`/getBAInvoiceDetails`, authenticate, invData.getInvoiceDetails)

const reverseTrans = require('../components/reverseBaseTransactinMapping')
router.post(`/reverseBaseTransactinMapping`, reverseTrans)

const transType = require('../components/lrData/getAvailBaseTransTypes')
router.get(`/getAvailTransTypes`, authenticate, transType.getAvailBaseTransType)

module.exports = router