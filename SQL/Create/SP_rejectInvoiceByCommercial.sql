USE `billhub`;
DROP procedure IF EXISTS `SP_rejectInvoiceByCommercial`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_rejectInvoiceByCommercial`(
IN reason varchar(100),
billId int(10),
memoId int(15),
userId int(15),
currentStatus varchar(50)
)
BEGIN

select DISTINCTROW m.Memo_Number,m.Submittion_Location_Code,b.status,b.BillNo,m.CreatedOn
  into @memo,@sloc,@st,@billNo,@submittedDate from memodetails m 
inner join billdetails b on m.Memo_ID = b.MemoID
where m.Memo_ID = memoId and b.BillDetails_ID = billId
and m.Submittion_Location_Code;

if(@memo != '')then
select DISTINCTROW Location_ID into @locationId from user_mapping
where user_id = userId and Location_ID = @sloc;

if( @locationId != '')then
if(@st = 'C')then
select 'Invoice is already rejected' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

elseif(TIMESTAMPDIFF(DAY,cast(@submittedDate as date),now()) <= 10  and currentStatus = 'S')
then
select 'You can only reject invoice after 10 days of submission' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

elseif(@st = 'A' or @st = 'V' or @st = 'B' or (currentStatus = 'S' and @st= 'S'))
then
update billdetails 
set UpdatedBy = userId,
UpdatedOn = now(),
status = "C",
Reason = reason,
BillNo = concat(BillNo, "-Rejected")
where BillDetails_ID = billId;

update bill_base_transaction_mapping 
set is_tagged_to_invoice = 0
where Bill_details_id = billId;

select 'Invoice rejected successFully' as success,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

elseif(currentStatus != 'S' and @st = 'S')then
select 'Please acknowledge this invoice' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

else
select 'You can not reject invoice at this stage' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;
end if;

else
select 'You do not have permission to this invoice' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;
end if;

else
select 'Invoice not found' as err;
end if;

END$$

DELIMITER ;

