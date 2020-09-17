USE `billhub`;
DROP procedure IF EXISTS `SP_GetInvoiceInfo`;

DELIMITER $$
USE `billhub`$$
CREATE DEFINER=`developer`@`%` PROCEDURE `SP_GetInvoiceInfo`(in billId int(10))
BEGIN

SELECT b.BillDetails_ID as billId,
b.BillNo as billNo,
b.BillDate as billDate,
b.Billing_To_code as billingToCode,
b.Billing_From_code as billingFromCode,
b.MemoID as memoID,
b.Service_code as serviceCode,
b.HSN_Code as hsnCode,
b.Comments as comment,
b.Customer_Name as customerName,
b.CGST as cgst,
b.SGST as sgst,
b.IGST as igst,
b.TaxableAmount as baseAmount,
b.Additional_Amount as additionalAmount,
b.Amount as totalAmount,
b.ApprovedBy as approvedBy,
concat(uv.First_Name,' ',uv.Last_Name) as approvedByName,
b.ApprovedOn as approvedOn,
b.AcknowledgedBy as acknowledgedBy,
concat(ua.First_Name,' ',ua.Last_Name) as acknowledgedByName,
b.AcknowledgedOn as acknowledgedOn,
b.TotalPayment_Released as totalPaymentReleased,
b.TotalPayment_Requested as totalPaymentRequested,
b.Trade_Discount as tradeDiscount,
b.BA_Code as baCode,
b.Reason as reason,
b.status as status,
b.PaymentReleasedOn as paymentReleasedOn,
b.PaymentRequestedOn as paymentRequestedOn,
m.Memo_Number as memoNumber,
m.Memo_Date as memoDate,
m.Submittion_Location_Code as submittionLocationCode,
m.Submit_To_ID as submitToId,
m.FiscalYear as fiscalYear,
m.CreatedOn as createdOn,
s.Service_Name as serviceName,
concat(u.First_Name,' ',u.Last_Name) as submitToName,
ba.BA_NAME as BA_NAME,
fn_getStateName(b.Billing_From_code) AS billingFromState,
fn_getStateName(b.Billing_To_code) AS billingToState,
l.Location_Name as submittionLocationName,
fn_getFullStatus(b.Status) as fullStatus,
b.inv_source as invSource,
b.isPO
FROM billhub.billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
inner join service_category s on s.Service_ID = b.Service_code
inner join users u on u.User_ID = m.Submit_To_ID
inner join ba on ba.BA_ID = b.BA_CODE
inner join location l on l.Location_ID = m.Submittion_Location_Code
left join users ua on ua.User_ID = b.AcknowledgedBy
left join users uv on uv.User_ID = b.ApprovedBy
where BillDetails_ID =billId;

SELECT 
Bill_File_Id as billFileId,
FilePath as filePath,
File_Name as fileName,
File_Type as fileType,
SUBSTRING_INDEX(FilePath, '.', -1) as extension
 FROM billhub.bill_file_details
where Bill_Details_ID =billId;

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
where Bill_details_id = billId and is_tagged_to_invoice = 1;

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
where bill_detail_id = billId;

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
iom.TDS as tds,
iom.Tax as taxAmount,

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
where BillDetails_Id = billId;


SELECT 
e.Document_No as krNo,
e.`Posting _Date` as postingDate,
e.Doc_Date as docDate,
e.`Payment Amount` as paymentAmount,
e.Expense_Amount as expenseAmount,
e.IsReversal as isReversal,
e.Clearing_Date as clearingDate,
e.Clearing_Doc as clearingDoc
 FROM billhub.expense e
where Bill_Details_ID =billId
and IsReversal = 0;


select pp.Payment_Req_No as paymentReqNo,
pp.Amount as paymentAmount,
pp.Status as paymentStatus,
pp.AB_Doc_No as abDocNo,
pp.AB_Doc_Date as abDocDate,
pp.Reject_Reason as rejectReason,
pp.Process_ID as paymentId,
pp.Created_On as paymentDate,
pp.Created_By as paymentBy
 from billhub.payment_processed_details pp
where BillDetails_ID = billId and pp.Status <> 'Rejected';

select 
ob.OnHold_Bill_ID as onholdId,
ob.OnHold_Date as onholdDate,
ob.Acc_Reason as accReason,
ob.Tax_Reason as taxReason,
ob.Status as onholdStatus,
ob.Resolved_Date as resolvedDate,
ob.Acc_User_ID as accountUser,
ob.Tax_User_ID as taxUser,
ob.Comm_User_ID as commercialUser,
ob.IsBlanketApproved as isBlanketApproved,
ob.IsBlanketApproved_Tax as isBlanketApprovedTax
 from billhub.onhold_bills ob
where BillDetails_ID = billId;

select 
Bill_Details_ID as billId,
Invoice_No as krNo,
Document_No as docNo,
`G/L` as glCode,
BA as baCode,
`Posting _Date` as postingDate,
Doc_Date as docDate,
Amount as amount,
Doc_Type as docType,
SAP_TEXT as sapText,
Year as fiscalYear,
Clearing_Date as clearingDate,
Clearing_Doc as clearingDoc,
Payment_Request_No as paymentReqNo,
Status as status
 from payment
where Bill_Details_ID = billId;


END$$

DELIMITER ;

