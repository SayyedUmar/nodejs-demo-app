CREATE TABLE  `filetypemst` (
  `file_type_id` int auto_increment,
  `file_type` varchar(100) DEFAULT NULL,
  `is_required` int DEFAULT 1,
  `files_limit` int DEFAULT 0,
  `userid` varchar(20) DEFAULT NULL,
  `is_active` int(5) DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
PRIMARY KEY (`file_type_id`)
);

insert into `filetypemst`(file_type,userid,is_active, created_date,files_limit)
values ('Invoice','Admin',1,now(),5),
('POD/Attendance register','Admin',1,now(),5),
('Reimbursement receipts','Admin',1,now(),5),
('Compliance Documents(PF/ESIC challans)','Admin',1,now(),5),
('Other Approvals','Admin',1,now(),5);