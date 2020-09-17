USE `billhub`;
DROP procedure IF EXISTS `SP_GroupPaymentByKR`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_GroupPaymentByKR`()
BEGIN

drop temporary table if exists open_partial_payment;	
create temporary table open_partial_payment(select * from(
SELECT p.*,py.ID,py.Invoice_No,py.BA,py.Amount,py.Document_No,py.Year,py.Status,
py.Doc_Type as `py_doc_type`
  FROM payment py
LEFT JOIN open_payments p ON py.Document_No = p.doc_no and py.Year = p.inv_ref_fy and py.Invoice_No = p.inv_reference
and py.ba = p.ven_code
where py.Doc_Type <> 'KR' and py.Status <> 'Reversed'
UNION
SELECT p.*,py.ID,py.Invoice_No,py.BA ,py.Amount,py.Document_No,py.Year,py.Status,
py.Doc_Type as `py_doc_type`
 FROM payment py
right JOIN open_payments p ON 
py.Document_No = p.doc_no and py.Year = p.inv_ref_fy and py.Invoice_No = p.inv_reference
and py.ba = p.ven_code
where  p.doc_type <> 'KR') as a);


SELECT k.*,
 nt.open_payment_id as `p_open_payment_id`,
    nt.co_code as `p_co_code`,
    nt.fiscal_year as `p_fiscal_year`,
    nt.gl_id as `p_gl_id`,
    nt.post_date as `p_post_date`,
    nt.doc_date as `p_doc_date`,
    nt.reference as `p_reference`,
    nt.header_text as `p_header_text`,
    nt.doc_type as `p_doc_type`,
    nt.doc_no as `p_doc_no`,
    nt.doc_item_no as `p_doc_item_no`,
    nt.ven_code as `p_ven_code`,
    nt.recon_gl as `p_recon_gl`,
    nt.base_date as `p_base_date`,
    nt.profit_center as `p_profit_center`,
    nt.amt_transaction as `p_amt_transaction`,
    nt.currency as `p_currency`,
    nt.special_gl as `p_special_gl`,
    nt.business_place as `p_business_place`,
    nt.item_text as `p_item_text`,
    nt.assignment as `p_assignment`,
    nt.entry_date as `p_entry_date`,
    nt.inv_reference as `p_inv_reference`,
    nt.inv_ref_fy as `p_inv_ref_fy`,
    nt.clear_doc_no as `p_clear_doc_no`,
    nt.clear_fy as `p_clear_fy`,
    nt.clear_date as `p_clear_date`,
    nt.audit_log_id as `p_audit_log_id`,
    nt.created_by as `p_created_by`,
    nt.created_on as `p_created_on`,
    nt.updated_by as `p_updated_by`,
    nt.updated_on as `p_updated_on`,
 nt.ID as `py_id`,
 nt.Amount as `py_amount`,
 nt.Document_No as `py_document_no`,
 nt.Year as `py_year`,
 nt.Status as `py_status`,
 nt.py_doc_type,
(case when nt.ID is null and nt.open_payment_id is null then 'open'
when nt.ID is null then 'new'
when nt.open_payment_id is null then 'removed' else 'added' end) as paymentStatus,
e.ID as expenseId,e.Bill_Details_ID as billId,
e.`Payment Amount`,
b.TotalPayment_Requested,b.TotalPayment_Released,b.status as billStatus,
b.BillNo as billNo,
adm.advance_document_id, adm.payment_req_no 
 FROM billhub.open_payments k
inner join expense e on e.Document_No = k.doc_no and e.Year_Month = k.fiscal_year 
 and e.Vendor = k.ven_code and IsReversal = 0
inner join billdetails b on b.BillDetails_ID = e.Bill_Details_ID
left join open_partial_payment as nt
on (case when nt.open_payment_id is not null then
k.doc_no = nt.inv_reference
and k.fiscal_year = nt.inv_ref_fy and k.ven_code = nt.ven_code
else
nt.Invoice_No = k.doc_no and nt.Year = k.fiscal_year and nt.BA = k.ven_code
end)
left join advance_document_mapping adm on adm.bill_detail_id = b.BillDetails_ID 
and adm.payment_req_no is not null
and ((adm.advance_document_number = nt.doc_no and adm.fiscal_year = nt.inv_ref_fy) or (adm.advance_document_number = nt.Document_No 
and adm.fiscal_year = nt.Year))
where k.doc_type = 'KR';


END$$

DELIMITER ;

