DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_GetAccBillDetails` $$
CREATE PROCEDURE `SP_GetAccBillDetails`(
IN billDetailsID INT
)
BEGIN

select bf.Bill_Details_ID as billDetailsId ,bf.FilePath as filePath,bf.File_Name as fileName,bf.file_type as fileType, bf.Bill_File_Id as billFileId,SUBSTRING_INDEX(bf.FilePath, '.', -1) as extension from bill_file_details bf where bf.Bill_Details_ID in (billDetailsID);
/*
select bo.RefKey3,io.Vertical_Name,c.Customer_Name from bill_internal_order_mapping bo inner join internal_order io on io.internal_order_id=bo.internal_order_id
inner join customer c on c.customer_id=io.customer_code where bo.BillDetails_ID in (billDetailsID);
*/

END $$

DELIMITER ;