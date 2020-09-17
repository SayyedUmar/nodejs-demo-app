DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_getAllDraftInvoiceDetails` $$
CREATE PROCEDURE `SP_getAllDraftInvoiceDetails`(
in draftBillId int)
BEGIN

-- declare draftbillId int default 0;
/*
select d.Draft_Bill_ID into draftbillId
from draft_bills d inner join ba b
on d.ba_code=b.ba_id
where d.Billing_From_code=fromStateCode
and d.Billing_To_code=toStateCode
and b.ba_group_id=baGroupID;*/

select
    b.BillDate AS billDate,
    b.BillNo AS billNo,
    b.BA_Code as baCode,
    b.Draft_Bill_ID as billId,
    b.MemoID AS memoId,
    b.Billing_From_code AS billingFromCode,
    b.Billing_To_code AS billingToCode,
    b.HSN_Code AS hsnCode,
    b.Service_code AS serviceCode,
    sc.Service_Name as serviceName,
    sc.Parent_Service_Name as parentServiceName,
    b.Comments AS comments,
    b.Customer_Name AS customerName,
    b.CGST AS cgst,
    b.SGST AS sgst,
    b.IGST AS igst,
    b.TaxableAmount AS baseAmount,
    b.Additional_Amount as additionalAmount,
    b.Trade_Discount as tradeDiscount,
	b.Amount AS totalAmount,
  --  m.Submittion_Location_Code as submittionLocationCode,
b.otherCharges as otherCharges,
b.status as status,b.reason,b.File_Path as filePath,
ifnull(b.inv_source,'') as invSource,isPO
FROM
    draft_bills b
inner join service_category sc on sc.Service_ID = b.Service_code
where b.draft_bill_id = draftBillId;

select
draft_Bill_File_Id as draftBillFileId,
FilePath as filePath,
File_Name as fileName,
File_Type as fileType
 from draft_bills_file_details
where draft_Bill_Details_ID = draftBillId;

select ID,Draft_Bill_Details_ID as draftBillDetailsID, Doc_Date as docDate, Posting_Date as postingDate, Provision_Document_Number as provisionDocumentNumber,
 Fiscal_year as fiscalYear,Provision_Document_Item as provisionDocumentItem, Internal_order as internalOrder,
 Base_Transaction_Type as baseTransactionType, Base_Transaction_Date as baseTransactionDate,
 Base_Transaction_Number as baseTransactionNumber, Customer_Code as customerCode, Amount_Provisional as amountProvisional,
 Amount as amount, is_tagged_to_invoice as isTaggedToInvoice, GL_Number as glNumber
from draft_bill_base_transaction_mapping
where Draft_Bill_Details_ID = draftBillId and is_tagged_to_invoice = 1;

END $$

DELIMITER ;