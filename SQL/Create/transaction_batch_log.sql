CREATE TABLE `transaction_batch_log` (
  `transaction_batch_id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `created_by` varchar(45) NOT NULL,
  `created_on` datetime NOT NULL,
  `success_log` text,
  `error_log` text,
  `status` varchar(45) DEFAULT NULL,
  `updated_by` varchar(45) DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL,
  `AuditLogID` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`transaction_batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1