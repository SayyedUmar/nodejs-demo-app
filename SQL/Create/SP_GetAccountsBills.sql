DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_GetAccountsBills` $$
CREATE PROCEDURE `SP_GetAccountsBills`(
IN _ROLE_ID INT,
in _USER_ID INT,
IN _PostingFromDate varchar(50),
IN _PostingEndDate varchar(50),
in _Verticals varchar(50),
in _Locations varchar(50),
in _KrDocNum varchar(50),
in _IsNonTaxable varchar(2),
in _billIDs varchar(1000),
in _commercialUserId varchar(10),
 in _isOrderByField varchar(20),
 in _order varchar(4),
in _limit INT,
in _offset INT,
in _allowPagtn varchar(20),
in _allowAllInvoice varchar(10)
)
BEGIN


-- declare _isOrderByField varchar(10) default '';
-- declare _order varchar(10) default '';
set @t1='';

IF (_ROLE_ID = 2)
then
    set @t1=concat(@t1,"select b.BillDetails_ID as 'invoiceID',b.memoid as 'memoID', billno as 'billNo',b.billdate as 'billdate',e.`Posting _Date` as 'postingDate',e.document_no as 'advanceDocument',b.ApprovedBy as 'approvedBy',b.file_Path as 'filePath',b.file_Path  as 'fileName',(select sum(exp.tds) from expense exp where exp.bill_details_id=b.billdetails_id and IsReversal ='0') as 'tds',(select sum(iom.td) from bill_internal_order_mapping iom where iom.billdetails_id=b.billdetails_id) as 'TradeDiscount',fn_getStateName(b.Billing_From_Code) as Billing_From_Name,fn_getStateName(b.Billing_To_Code) as Billing_To_Name,b.taxableamount as 'taxableAmount',b.amount as 'invoiceAmount',b.CGST as 'cgst',b.SGST as 'sgst',b.IGST as 'igst',e.Profit_Ctr as 'locationName',o.acc_reason as 'accountReason',o.Tax_reason as 'taxReason',o.Acc_User_ID as 'accUserID',o.Tax_User_ID as 'taxUserID',o.Comm_User_ID as 'CommUserID',ba.ba_name as 'baName', ba.ba_code as 'baGroupId',e.order_no as 'reason',e.gst as 'gst',e.document_no as 'krNumber', ");
    set @t1=concat(@t1," (select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=o.Acc_User_ID and u.Role_Id != 1 limit 1) as 'accUsername',(select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=o.Tax_User_ID and u.Role_Id != 1 limit 1) as 'taxUsername',(select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=b.ApprovedBy and u.Role_Id != 1 limit 1) as 'approvedByName',b.status,e.IsReversal,o.status as 'Commercial_Reason',ba.ba_code as 'baGSTCode',e.segment as verticalName,b.hsn_code");
    set @t1=concat(@t1," from billdetails b left join onhold_bills o on b.BillDetails_ID=o.BillDetails_ID and o.Status = 'OnHold' ");
    set @t1=concat(@t1," join memodetails memo on memo.memo_id=b.memoid join expense e on e.bill_details_id = b.billdetails_id and e.id =o.expense_id ");
    set @t1=concat(@t1," join ba ba on ba.ba_id = b.ba_code join vertical v on v.vertical_Name=e.segment and v.active=1 ");

    set @t1=concat(@t1," where (o.Acc_Reason != 'OK' || o.Tax_reason != 'OK') ");
   set @t1=concat(@t1," and memo.Submittion_Location_Code in (select um.location_id from user_mapping um join users u on um.user_id=u.user_id where u.user_id=",_USER_ID,") ");


if((_PostingFromDate!=null || _PostingFromDate!='') && (_PostingEndDate!=null || _PostingEndDate!=''))
then
set @t1=concat(@t1," and (e.`Posting _Date` between date_format(STR_TO_DATE('",_PostingFromDate,"','%Y-%m-%d'),'%Y-%m-%d') and date_format(STR_TO_DATE('",_PostingEndDate,"','%Y-%m-%d'),'%Y-%m-%d')) ");
end if;

if(_Locations!=null || _Locations!='')
then

set @location=_Locations;

if(LEFT(TRIM(@location),1)=',')
  then
  set @location= SUBSTRING(@location, 2);
end if;

if(RIGHT(TRIM(@location),1)=',')
   then
   set @location= SUBSTRING(@location, 1, LENGTH(@location)-1);
end if;

 set @location= REPLACE(@location,",","','");
set @t1=concat(@t1," and e.busArea in ('",@location,"') ");
end if;

if(_KrDocNum!=null || _KrDocNum!='')
then

set @krDocNum=_KrDocNum;

if(LEFT(TRIM(@krDocNum),1)=',')
  then
  set @krDocNum= SUBSTRING(@krDocNum, 2);
end if;

if(RIGHT(TRIM(@krDocNum),1)=',')
   then
   set @krDocNum= SUBSTRING(@krDocNum, 1, LENGTH(@krDocNum)-1);
end if;

 set @krDocNum= REPLACE(@krDocNum,",","','");

set @t1=concat(@t1," and e.Document_No in ('",@krDocNum,"') ");
end if;

if(_IsNonTaxable!=null || _IsNonTaxable!='')
then
if(_IsNonTaxable='1')
then
set @t1=concat(@t1," and e.gst=0 ");
else
set @t1=concat(@t1," and e.gst>0 ");
end if;
end if;

if(_Verticals !=null || _Verticals!='')
then
set @t1=concat(@t1," and v.Vertical_id in (",_Verticals,") ");
end if;

set @t1=concat(@t1," order by o.onhold_Date asc ");


set @t2='';
set @t2=concat(@t2,"SELECT COUNT(*) as totalRows FROM(",@t1,") AS t");

 PREPARE stmt4 FROM @t2;
EXECUTE stmt4;

if(_allowPagtn=1)
then
  set @t1=concat(@t1," LIMIT ",_offset,",", _limit );
 end if;


set @t1=concat(@t1,";");
-- select @t1;

 PREPARE stmt3 FROM @t1;
 EXECUTE stmt3;

else

    set @t1=concat(@t1,"select  b.BillDetails_ID as 'invoiceID',b.memoid as 'memoID',e.id as 'expenseId', billno as 'billNo',b.billdate as 'billdate',e.`Posting _Date` as 'postingDate',e.document_no as 'advanceDocument',b.ApprovedBy as 'approvedBy',e.TDS as 'tds',b.taxableamount as 'taxableAmount',b.amount as 'invoiceAmount',b.CGST as 'cgst',b.SGST as 'sgst',b.IGST as 'igst',e.Profit_Ctr as 'locationName',o.acc_reason as 'accountReason',o.Tax_reason as 'taxReason',o.Acc_User_ID as 'accUserID',o.Tax_User_ID as 'taxUserID',o.Comm_User_ID as 'CommUserID', ba.ba_code as 'baGroupId',e.order_no as 'reason',e.gst as 'gst',e.document_no as 'krNumber',(select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=o.Acc_User_ID and u.Role_Id != 1 limit 1) as 'accUsername',(select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=o.Tax_User_ID and u.Role_Id != 1 limit 1) as 'taxUsername',(select concat(u.First_Name,'-',u.Last_Name) from users u where u.User_ID=b.ApprovedBy and u.Role_Id != 1 limit 1) as 'approvedByName',b.status as 'status',o.status as 'Commercial_Reason',ba.ba_name as 'baName',ba.ba_code as 'baGSTCode',e.segment as verticalName,b.hsn_code ");
    set @t1=concat(@t1," from expense e join billdetails b on e.bill_details_id = b.billdetails_id join ba ba on ba.ba_id = b.ba_code ");
    set @t1=concat(@t1," left join onhold_bills o on b.billdetails_id = o.billdetails_id ");
    set @t1=concat(@t1," join vertical v on v.vertical_Name=e.segment and v.active=1 ");
    set @t1=concat(@t1," where  b.`status` in ('B','R') and e.IsPaymentDetailsUpdated = '1' and e.IsReversal = '0' ");


IF (_ROLE_ID = 3)
then

if (_allowAllInvoice = '0')-- pending invoices
then
set @t1=concat(@t1," and (o.Acc_Reason != 'OK' || o.Acc_reason is null) ");
end if;

else

if (_allowAllInvoice = '0')-- pending invoices
then
set @t1=concat(@t1," and (o.Tax_reason != 'OK' || o.Tax_reason is null) ");
end if;

end if;

if((_PostingFromDate!=null || _PostingFromDate!='') && (_PostingEndDate!=null || _PostingEndDate!=''))
then
set @t1=concat(@t1," and (e.`Posting _Date` between date_format(STR_TO_DATE('",_PostingFromDate,"','%Y-%m-%d'),'%Y-%m-%d') and date_format(STR_TO_DATE('",_PostingEndDate,"','%Y-%m-%d'),'%Y-%m-%d')) ");
end if;

if(_Locations!=null || _Locations!='')
then

set @location=_Locations;
if(LEFT(TRIM(@location),1)=',')
  then
  set @location= SUBSTRING(@location, 2);
  end if;

  if(RIGHT(TRIM(@location),1)=',')
   then
   set @location= SUBSTRING(@location, 1, LENGTH(@location)-1);
  end if;
 set @location= REPLACE(@location,",","','");
-- select @location;
set @t1=concat(@t1," and e.busArea in ('",@location,"') ");
end if;

if(_KrDocNum!=null || _KrDocNum!='')
then
set @krDocNum=_KrDocNum;

if(LEFT(TRIM(@krDocNum),1)=',')
  then
  set @krDocNum= SUBSTRING(@krDocNum, 2);
end if;

if(RIGHT(TRIM(@krDocNum),1)=',')
   then
   set @krDocNum= SUBSTRING(@krDocNum, 1, LENGTH(@krDocNum)-1);
end if;

 set @krDocNum= REPLACE(@krDocNum,",","','");


set @t1=concat(@t1," and e.Document_No in ('",@krDocNum,"') ");
end if;

if(_IsNonTaxable!=null || _IsNonTaxable!='')
then
if(_IsNonTaxable='1')
then
set @t1=concat(@t1," and e.gst=0 ");
else
set @t1=concat(@t1," and e.gst>0 ");
end if;
end if;

if(_Verticals !=null || _Verticals!='')
then
set @t1=concat(@t1," and v.Vertical_id in (",_Verticals,") ");

end if;

if(_billIDs!=null || _billIDs!='')
then
set @t1=concat(@t1," and b.billdetails_id in (",_billIDs,") ");
end if;

if(_commercialUserId!=null || _commercialUserId!='')
then
set @t1=concat(@t1," and b.approvedby=",_commercialUserId," ");
end if;

if(_isOrderByField!=null || _isOrderByField!='')
then

if(_isOrderByField='COMMERCIAL_NAME')
then
set @t1=concat(@t1," order by b.ApprovedBy ",_order );
elseif(_isOrderByField='BA_NAME')
then
set @t1=concat(@t1," order by ba.ba_name ",_order);
elseif(_isOrderByField='KR_NO')
then
set @t1=concat(@t1," order by e.document_no ",_order);
elseif(_isOrderByField='INVOICE_NO')
then
set @t1=concat(@t1," order by b.billno ",_order);
elseif(_isOrderByField='POSTING_DATE')
then
set @t1=concat(@t1," order by e.`Posting _Date` ",_order);
elseif(_isOrderByField='TAX')
then
set @t1=concat(@t1," order by e.gst ",_order);
end if;

 else
 set @t1=concat(@t1," order by o.onhold_Date asc ");
end if;

set @t2='';
set @t2=concat(@t2,"SELECT COUNT(*) as totalRows FROM(",@t1,") AS t");

 PREPARE stmt4 FROM @t2;
EXECUTE stmt4;

if(_allowPagtn=1)
then
  set @t1=concat(@t1," LIMIT ",_offset,",", _limit );
 end if;


set @t1=concat(@t1,";");
-- select @t1;

 PREPARE stmt3 FROM @t1;
 EXECUTE stmt3;
end if;

END $$

DELIMITER ;