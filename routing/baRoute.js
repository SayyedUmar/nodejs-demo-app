const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const ba = require('../components/baUserData/baDetails/getBaDetails')
router.get(`/getallba`, authenticate, ba.getBaData)

const saveBa = require('../components/baUserData/baDetails/saveBADetails')
router.post(`/saveBa`, saveBa.saveOrUpdateBADetails)

const loggedInUserData = require('../components/baUserData/loggedInUserDetails/getLoggedInUserData')
router.get(`/getUserData/:userId`, authenticate, loggedInUserData.GetLoggedUserData)

const serviceType = require('../components/baUserData/loggedInUserDetails/getServiceType')
router.get(`/getServiceType`, authenticate, serviceType.getAllServiceType)

module.exports = router