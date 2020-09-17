alter table ba add (Bank_Acc_No VARCHAR(18),IFSC_Code varchar(15),Bank_Name varchar(45));

ALTER TABLE `billhub`.`draft_bills`
ADD COLUMN `Additional_Amount` DOUBLE NULL DEFAULT '0' ,
ADD COLUMN `Trade_Discount` DOUBLE NULL DEFAULT '0' AFTER `Additional_Amount`,

ALTER TABLE `billhub`.`billdetails`
ADD COLUMN `Additional_Amount` DOUBLE NULL DEFAULT '0' AFTER `Advance_TDS`,
ADD COLUMN `Trade_Discount` DOUBLE NULL DEFAULT '0' AFTER `Additional_Amount`
ADD COLUMN `ReversedOn` DATETIME NULL AFTER `Trade_Discount`;

alter table draft_bills add column inv_source varchar(10) default null;
alter table billdetails add column inv_source varchar(10) default null;

alter table billhub.draft_bills add column isPO int(2) default 0;
alter table billhub.billdetails add column isPO int(2) default 0;

alter table  bill_file_details add `File_Type` varchar(45) NOT NULL;
alter table  draft_bills_file_details add `File_Type` varchar(45) NOT NULL;

alter table billhub.withholding_tax add description varchar(45) DEFAULT NULL;

alter table onhold_Bills add expense_id int;

alter table billhub.state add Region_Code int(10);

alter table billhub.withholding_tax add description varchar(45) DEFAULT NULL;


ALTER TABLE `billhub`.`users` 
CHANGE COLUMN `AuthToken` `AuthToken` TEXT NULL DEFAULT NULL ;


ALTER TABLE `billhub`.`user_activity_log` 
CHANGE COLUMN `Old_Value` `Old_Value` TEXT NULL DEFAULT NULL ,
CHANGE COLUMN `New_Value` `New_Value` TEXT NULL DEFAULT NULL ;

alter table `billhub`.`bill_internal_order_mapping` add `Assignment` varchar(255) DEFAULT NULL;
alter table `billhub`.`bill_internal_order_mapping` add `Item_Text` varchar(255) DEFAULT NULL;
alter table `billhub`.`bill_internal_order_mapping` add `GL_Number` varchar(45) DEFAULT NULL;

alter table `billhub`.`customer` add `Pan_No` varchar(45) DEFAULT NULL;
alter table `billhub`.`customer` add `Tax_No` varchar(45) DEFAULT NULL;

CREATE INDEX `index_Doc_No` ON `billhub`.`expense` (`Document_No`);

ALTER TABLE `billhub`.`glcode` ADD UNIQUE INDEX `Gl_code_UNIQUE` (`Gl_code` ASC);

ALTER TABLE `billhub`.`internal_order` ALTER COLUMN `Customer_Code` varchar(45) DEFAULT NULL;
ALTER TABLE `billhub`.`internal_order` add `Customer_Pan` varchar(45) DEFAULT NULL;
ALTER TABLE `billhub`.`internal_order` ADD UNIQUE INDEX `Internal_order_Number_UNIQUE` (`Internal_order_Number` ASC);
ALTER TABLE `billhub`.`internal_order` DROP FOREIGN KEY `FK_New Table_Cust`;

alter table `billhub`.`payment_processed_details` add `Reject_Reason` varchar(45) DEFAULT NULL;

ALTER TABLE `billhub`.`taxcode` ADD UNIQUE INDEX `tax_code_UNIQUE` (`tax_code` ASC);

alter table `billhub`.`reason` add `Type` varchar(45) DEFAULT NULL;