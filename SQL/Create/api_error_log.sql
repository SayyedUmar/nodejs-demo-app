CREATE TABLE `api_error_log` (
  `errlog_id` int(11) NOT NULL DEFAULT '0',
  `module_name` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `pre_reference_num` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `sec_reference_num` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `ter_reference_num` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `document_number` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `errormsg` varchar(2000) CHARACTER SET utf8 DEFAULT NULL,
  `created_on` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1