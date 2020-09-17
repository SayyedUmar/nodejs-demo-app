const authenticate = require('../utils/middleware/authAuthenticate').authenticate;
const sapAuthenticate = require('../utils/middleware/authAuthenticate').sapAuthenticate;

const rejectionReasons = require('../components/masters/getRejectionReason')
router.get(`/getAllRejectionReasons`, authenticate, rejectionReasons.getRejectionReason)

const glCode = require('../components/masters/getGLCode')
router.get(`/getAllGLCode`, authenticate, glCode.getAllGLCode)

const hsnCode = require('../components/masters/getHSNCode')
router.get(`/getHSNCode`, authenticate, hsnCode.getHSNCode)

const taxCode = require('../components/masters/getTaxCode')
router.get(`/getAllTaxCode`, authenticate, taxCode.getAllTaxCode)

const serviceCategory = require('../components/masters/getServiceCategory')
router.get(`/getParentServiceCat`, authenticate, serviceCategory.getServiceCat.getParentServiceCat)
router.get(`/getServiceCat/:serviceCat`, authenticate, serviceCategory.getServiceCat.getChildServiceCat)

const internalOrderData = require('../components/getInternalOrderList')
router.get(`/getInternalOrderlist`, authenticate, internalOrderData.getInternalOrderList)

const fileTypeData = require('../components/masters/getFileTypeList')
router.get(`/getFileTypeList`, authenticate, fileTypeData.getFileTypeList)
const withHoldingTax = require('../components/masters/getWithHoldingTax')
router.get(`/getWithHoldingTax`, authenticate, withHoldingTax.getWithHoldingTax)


const internalOrder = require('../components/masters/saveInternalOrder')
router.post(`/saveInternalOrder`, sapAuthenticate, internalOrder.saveInternalOrder)

const saveGLCode = require('../components/masters/saveGLCode')
router.post(`/saveGLCode`, authenticate, saveGLCode.saveGLCode)

const saveTaxCode = require('../components/masters/saveTaxCode')
router.post(`/taxCode`, authenticate, saveTaxCode.saveTaxCode)

const saveWithHoldingTax = require('../components/masters/saveWithHoldingTax')
router.post(`/saveWithHoldingTax`, authenticate, saveWithHoldingTax.saveWithHoldingTax)

const ohholdReasons = require('../components/masters/getOnHoldReasons')
router.get(`/getOnHoldReasons`, authenticate, ohholdReasons.getOnHoldReason)

const commercialLst = require('../components/masters/getCommercialList')
router.get(`/getCommercialList`, authenticate, commercialLst.getCommercialList)

const locations = require('../components/masters/getLocationList')
router.get(`/getLocations`, authenticate, locations.getLocationList)

const customerMaster = require('../components/masters/saveCustomerMaster')
router.post(`/saveCustomerMaster`, sapAuthenticate, customerMaster.saveCustomerMaster)

const paymentTerms = require('../components/masters/getPaymentTerms')
router.get(`/getPaymentTerms`, authenticate, paymentTerms.getPaymentTerms)

const vertical = require('../components/masters/getAllVertical')
router.get(`/getAllVertical`, authenticate, vertical.getAllVertical)

module.exports = router