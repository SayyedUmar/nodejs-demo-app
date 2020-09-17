USE `billhub`;
DROP procedure IF EXISTS `SP_acknowledgeInvoiceByCommercial`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_acknowledgeInvoiceByCommercial`(
IN billId int(10),
memoId int(15),
userId int(15),
acknowledgeDate date
)
BEGIN

select DISTINCTROW m.Memo_Number,m.Submittion_Location_Code,b.status,b.BillNo  into @memo,@sloc,@st,@billNo
 from memodetails m 
inner join billdetails b on m.Memo_ID = b.MemoID
where m.Memo_ID = memoId and b.BillDetails_ID = billId;

if(@memo != '')then
select DISTINCTROW Location_ID into @locationId from user_mapping
where user_id = userId and Location_ID = @sloc;

if( @locationId != '')then
if(@st = 'A')then
select 'Invoice is already acknowledged' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

elseif(@st = 'C')then
select 'Invoice is rejected' as err,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

elseif(@st= 'S')
then
update billdetails 
set UpdatedBy = userId,
UpdatedOn = now(),
status = "A",
AcknowledgedBy = userId,
AcknowledgedOn = acknowledgeDate
where BillDetails_ID = billId;

select 'Invoice acknowledged successFully' as success,
@st as oldStatus ,@memo as memoNumber,@billNo as billNo;

else
select 'You can not acknowledge invoice at this stage' as err,
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

