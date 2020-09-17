const successFormat = (status, message, data, error) => {
  return {
    status,
    message,
    data,
    error
  }
}

const errorFormat = (status, message, data, error, code = 200) => {
  return {
    status,
    message,
    data,
    error,
    code
  }
}

const sapFormat = (BACODE, VendorCode, MessType, Message) => {
  return {
    BACODE,
    VendorCode,
    MessType,
    Message
  }
}

module.exports = {
  successFormat,
  errorFormat,
  sapFormat
}