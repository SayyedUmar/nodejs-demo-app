const authenticate = require('../utils/middleware/authAuthenticate').authenticate;

const fileUpload = require('../components/file/uploadFile')
router.post(`/upload`, upload.array('file', 100), authenticate, fileUpload.uploadFiles)

router.post(`/remove`, authenticate, fileUpload.deleteFiles)

module.exports = router