const login = require('../components/login/userLogin')
router.post(`/userLogin`, login.userLogin)

const sapMaster = require('../components/login/sapMasterLogin')
router.post(`/sapMasterLogin`, sapMaster.sapMasterLogin)

module.exports = router