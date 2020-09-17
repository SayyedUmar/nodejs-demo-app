DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_GetAllBookedBills` $$
CREATE  PROCEDURE `SP_GetAllBookedBills`(
IN _SapUploadFDate varchar(50),
IN _SapUploadEDate varchar(50)
)
BEGIN

select e.Vendor,e.document_no as 'Document_No',  b.billno as 'Bill_No',b.hsn_code as 'HSN_Code', e.`Posting _Date`  as 'Posting_Date',e.Doc_Date,e.With_tax_base_amount as 'With_Tax_Base_Amount',e.Withholding_tax_amnt as 'Withholding_Tax_Amount',e.Amount,e.BusArea,e.Cost_Ctr,e.Tax,e.Ref_Key_3,e.Ref_Key_2,e.Ref_Key_1,
e.Reference_Key,e.Segment,e.CGST,e.SGST,e.IGST,e.TDS,e.`Payment Amount` as 'Payment_Amount',e.GST,e.TD,e.VD,e.Expense_Amount,e.Profit_Ctr,
e.Assignment,e.Doc_Type,e.Payment_date,e.Clearing_Date,e.Clearing_Doc,e.Itm,e.Year_Month,e.Doc_Header_Text,e.Invoice_No,
e.SAP_TEXT,e.Reversal_Document,e.Order_no,s.plant_code
from expense e join billdetails b on e.bill_details_id = b.billdetails_id
join ba ba on ba.ba_id = b.ba_code
join vertical v on v.vertical_Name=e.segment and v.active=1
 join state s on b.billing_to_code=s.state_id and s.isactive=1
where  b.`status` in ('B') and e.IsReversal = '0'
and (b.SAPUploadOn between date_format(STR_TO_DATE(_SapUploadFDate,'%Y-%m-%d'),'%Y-%m-%d')
and date_format(STR_TO_DATE(_SapUploadEDate,'%Y-%m-%d'),'%Y-%m-%d'))
 order by b.SAPUploadOn asc ;

select e.segment as Vertical, e.busArea as Location
 ,count(*) as Count
from expense e join billdetails b on e.bill_details_id = b.billdetails_id
where  b.`status` in ('B') and e.IsReversal = '0'
and (b.SAPUploadOn between date_format(STR_TO_DATE(_SapUploadFDate,'%Y-%m-%d'),'%Y-%m-%d')
and date_format(STR_TO_DATE(_SapUploadEDate,'%Y-%m-%d'),'%Y-%m-%d'))
group by e.segment ,e.busArea
  order by e.segment asc ;


END $$

DELIMITER ;