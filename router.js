router.use('/ba', require('./routing/baRoute'))
router.use('/masterdata', require('./routing/masterRoute'))
router.use('/transactionData', require('./routing/transactionRoute'))
router.use('/commercial', require('./routing/commercialRoute'))
router.use('/file', require('./routing/fileRoute'))
router.use('/accVerification', require('./routing/accVerificationRoute'))
router.use('/common', require('./routing/commonRoute'))
router.use('/user', require('./routing/loginRoute'))

module.exports = router