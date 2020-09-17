USE `billhub`;
DROP procedure IF EXISTS `SP_getInvoiceDetails`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_getInvoiceDetails`(
in userId int,
billId int(10))
BEGIN
set @billDetailsId = 0;
set @BillingFromCode = 0;
set @BillingToCode = 0;
select BillDetails_ID,Billing_From_code ,Billing_To_code into
@billDetailsId,@BillingFromCode,@BillingToCode
 from billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
where b.BillDetails_ID = billId and
Submittion_Location_Code in (select Location_ID from user_mapping
where user_id = userId);


SELECT 
    b.BillDate AS billDate,
    b.BillNo AS billNo,
    b.BA_Code as baCode,
    b.BillDetails_ID as billId,
    b.MemoID AS memoId,
    b.Billing_From_code AS billingFromCode,
    fn_getStateName(b.Billing_From_code) AS billingFromState,
    b.Billing_To_code AS billingToCode,
    fn_getStateName(b.Billing_To_code) AS billingToState,
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
    m.Submittion_Location_Code as submittionLocationCode,
    l.Location_Name as submittionLocationName,
    fn_getFullStatus(b.Status) as status,
    DATE_FORMAT(m.CreatedOn, "%Y-%m-%d") as submittedAt,
    b.inv_source as invSource,
b.isPO
FROM
    billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
inner join location l on l.Location_ID = m.Submittion_Location_Code
inner join service_category sc on sc.Service_ID = b.Service_code
where b.BillDetails_ID = @billDetailsId ;

select 
Bill_File_Id as billFileId,
FilePath as filePath,
File_Name as fileName,
File_Type as fileType,
SUBSTRING_INDEX(FilePath, '.', -1) as extension
 from bill_file_details
where Bill_Details_ID = @billDetailsId;

select 
ID as billBaseTransactionId,
Base_Transaction_Number as lrNumber,
Amount as amount,
Internal_order as internalOrder,
Base_Transaction_Type as baseTransactionType ,
GL_Number as glNumber ,
Base_Transaction_Date as baseTransactionDate ,
bill_internal_order_id as billInternalOrderMappingId
from bill_base_transaction_mapping
where Bill_details_id = @billDetailsId and is_tagged_to_invoice = 1;

select 
tax_id as taxId,
tax_code as taxCode,
Description as description,
tax_percentage as taxPercentage
 from taxcode
where 
case when @BillingFromCode = @BillingToCode
then description not like '%IGST%'
else description not like '%CGST%'
end;

SELECT 
i.Internal_order_Number as internalOrder,
i.Internal_order_id as internalOrderId,

iom.ID as billIOMappingId,
iom.Amount as amount,
iom.HSN_Code as hsnCode,
iom.Assignment as assignment,
iom.Item_Text as itemText,
iom.Header_Text as headerText,
iom.TD as td,

gl.Gl_code as glNumber	,
gl.Gl_Description as glDescription,
gl.Gl_ID as glId,

tx.tax_id as taxId,
tx.tax_code as taxCode,
tx.Description as taxDescription,
tx.tax_percentage as taxPercentage,

wt.`w/h_id` as whId,
wt.`w/h_tax_code` as whTaxCode,
wt.`w/h_tax_type` as whTaxType,
wt.`tax_rate` as whTaxRate

FROM billhub.bill_internal_order_mapping iom
left join internal_order i on i.Internal_order_id = iom.Internal_order_id
left join withholding_tax wt on wt.`W/H_ID` = iom.`W/H_ID`
left join taxcode tx on tx.tax_id = iom.Taxcode_id
left join glcode gl on gl.Gl_code = iom.GL_Number
where BillDetails_Id = @billDetailsId;


SELECT 
advance_document_id as advanceDocumentId,
advance_document_number as 	documentNumber,
advance_payment as amount,
fiscal_year as fiscalYear,
doc_type as docType,
doc_date as docDate,
post_date as postDate,
profit_center as profitCenter,
bussiness_place as businessPlace,
document_amount as advanceAmount
FROM billhub.advance_document_mapping
where bill_detail_id =@billDetailsId;

END$$

DELIMITER ;

