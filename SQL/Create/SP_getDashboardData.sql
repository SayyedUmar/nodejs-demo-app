USE `billhub`;
DROP procedure IF EXISTS `SP_getDashboardData`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_getDashboardData`(
in parentId varchar(20), userId int, serviceCode text, locations text, _status text, startDate varchar(20), endDate varchar(20),
billDate varchar(20),memoNo text, baName text,billNo text, 
overDue varchar(20),onhold varchar(20),
_limit int, _offset int,_type varchar(20),billIds text,
_vertical text,submittedTo text
)
BEGIN

if(_type='data')
then

SELECT 
b.BillDetails_ID as billId,
b.BillNo as billNo,
(case
when b.status = 'C' or b.status = 'S' or b.status = 'P'
then ''
else
datediff(sysdate(),b.acknowledgedOn)end) as age,
b.Amount as totalAmount,
b.BillDate as billDate,
b.AcknowledgedOn as acknowledgedOn,
(case
when  parentId <> '' and (b.status = 'V' or b.status = 'B' or b.status = 'R')
then 'In progress' else
fn_getFullStatus(b.status)end) as status,
b.BA_Code as baCode,
m.Memo_ID as memoId,
m.Memo_Number as memoNo,
m.Memo_Date as memoDate,
m.Submittion_Location_Code as submittionLocationCode,
l.location_name as submittionLocation,
ba.ba_name as baName,
b.Service_code as serviceCode,
fn_getServiceCatName(b.Service_code) as serviceName,
oh.Acc_Reason as accReason,
oh.Tax_Reason as taxReason,
b.Reason as rejectReason,
e.Deviation_Reason as deviationReason,
e.TDS as tds,
e.TD as td,
b.Trade_Discount as tradeDiscount,
m.Submit_To_ID as submitToId,
concat(u.First_Name,' ',u.Last_Name) as submitToName,
b.inv_source as invSource,
b.isPO
 FROM billhub.billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
inner join ba ba on ba.BA_ID = b.BA_Code
inner join location l on l.Location_ID = m.Submittion_Location_Code
left join onhold_bills oh on oh.BillDetails_ID = b.BillDetails_ID
left join expense e on e.Bill_Details_ID = b.BillDetails_ID and e.IsReversal = 0
left join vertical v on v.Vertical_Name = e.Segment
inner join users u on u.User_ID = m.Submit_To_ID
where (case when parentId <> '' then ba.BA_GROUP_ID = parentId else 1 end)
and (case when userId <> 0 then m.Submittion_Location_Code in (select Location_ID from user_mapping where user_id = userId)  else 1 end)
and (case when serviceCode <> '' then FIND_IN_SET (b.Service_code ,serviceCode)  else 1 end)
and (case when submittedTo <> '' then FIND_IN_SET (m.Submit_To_ID ,submittedTo)  else 1 end)
and (case when _vertical <> '' then FIND_IN_SET (v.Vertical_Id ,_vertical)  else 1 end)
and (case when billIds <> '' then FIND_IN_SET (b.BillDetails_ID ,billIds)  else 1 end)
and (case when locations <> '' then FIND_IN_SET (m.Submittion_Location_Code ,locations)  else 1 end)
and (case when startDate <> '' and endDate <> '' then (b.BillDate BETWEEN startDate AND endDate) else 1 end)
and (case when _status <> '' then FIND_IN_SET (b.status ,_status) else 1 end)
and (case when billDate <> ''  then b.BillDate =billDate else 1 end)
and (case when overDue <> '' then ( b.status <> 'S' and sysdate() > DATE_ADD(b.AcknowledgedOn , INTERVAL (ba.Credit_Period + 2) DAY))else 1 end)
and (case when onhold <> '' then (oh.Acc_Reason <> 'OK' and oh.Tax_Reason <> 'OK')  else 1 end)
and m.Memo_Number like concat(ifnull(memoNo, m.Memo_Number), '%')
and ba.BA_NAME like concat(ifnull(baName, ba.BA_NAME), '%')
and b.BillNo like concat(ifnull(billNo, b.BillNo), '%')
order by b.BillDate desc
limit _offset, _limit;

SELECT b.status,count(b.status) as count,sum(b.Amount) as total, fn_getFullStatus(b.status) as fullStatus FROM billhub.billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
inner join ba ba on ba.BA_ID = b.BA_Code
inner join location l on l.Location_ID = m.Submittion_Location_Code
left join onhold_bills oh on oh.BillDetails_ID = b.BillDetails_ID
left join expense e on e.Bill_Details_ID = b.BillDetails_ID and e.IsReversal = 0
left join vertical v on v.Vertical_Name = e.Segment
where (case when parentId <> '' then ba.BA_GROUP_ID = parentId else 1 end)
and (case when userId <> 0 then m.Submittion_Location_Code in (select Location_ID from user_mapping where user_id = userId)  else 1 end)
and (case when serviceCode <> '' then FIND_IN_SET (b.Service_code ,serviceCode)  else 1 end)
and (case when submittedTo <> '' then FIND_IN_SET (m.Submit_To_ID ,submittedTo)  else 1 end)
and (case when _vertical <> '' then FIND_IN_SET (v.Vertical_Id ,_vertical)  else 1 end)
and (case when locations <> '' then FIND_IN_SET (m.Submittion_Location_Code ,locations)  else 1 end)
and (case when startDate <> '' and endDate <> '' then (b.BillDate BETWEEN startDate AND endDate) else 1 end)
and (case when _status <> '' then FIND_IN_SET( b.status ,_status) else 1 end)
and (case when billDate <> ''  then b.BillDate =billDate else 1 end)
and (case when overDue <> '' then (b.status <> 'S' and sysdate() > DATE_ADD(b.AcknowledgedOn , INTERVAL (ba.Credit_Period + 2) DAY))else 1 end)
and (case when onhold <> '' then (oh.Acc_Reason <> 'OK' and oh.Tax_Reason <> 'OK') else 1 end)
and m.Memo_Number like concat(ifnull(memoNo, m.Memo_Number), '%')
and ba.BA_NAME like concat(ifnull(baName, ba.BA_NAME), '%')
and b.BillNo like concat(ifnull(BillNo, b.BillNo), '%')
group by (b.status);

else
SELECT 
b.BillDetails_ID as billId,
b.BillNo as billNo,
(case
when b.status = 'C' or b.status = 'S' or b.status = 'P'
then ''
else
datediff(sysdate(),b.acknowledgedOn)end) as age,
b.Amount as totalAmount,
b.BillDate as billDate,
b.AcknowledgedOn as acknowledgedOn,
(case
when  parentId <> '' and (b.status = 'V' or b.status = 'B' or b.status = 'R')
then 'In progress' else
fn_getFullStatus(b.status)end) as status,
b.BA_Code as baCode,
m.Memo_ID as memoId,
m.Memo_Number as memoNo,
m.Memo_Date as memoDate,
m.Submittion_Location_Code as submittionLocationCode,
l.location_name as submittionLocation,
ba.ba_name as baName,
b.Service_code as serviceCode,
fn_getServiceCatName(b.Service_code) as serviceName,
oh.Acc_Reason as accReason,
oh.Tax_Reason as taxReason,
b.Reason as rejectReason,
e.Deviation_Reason as deviationReason,
e.TDS as tds,
e.TD as td,
b.Trade_Discount as tradeDiscount,
m.Submit_To_ID as submitToId,
concat(u.First_Name,' ',u.Last_Name) as submitToName,
b.inv_source as invSource,
b.isPO
 FROM billhub.billdetails b
inner join memodetails m on m.Memo_ID = b.MemoID
inner join ba ba on ba.BA_ID = b.BA_Code
inner join location l on l.Location_ID = m.Submittion_Location_Code
left join onhold_bills oh on oh.BillDetails_ID = b.BillDetails_ID
left join expense e on e.Bill_Details_ID = b.BillDetails_ID and e.IsReversal = 0
left join vertical v on v.Vertical_Name = e.Segment
inner join users u on u.User_ID = m.Submit_To_ID
where (case when parentId <> '' then ba.BA_GROUP_ID = parentId else 1 end)
and (case when userId <> 0 then m.Submittion_Location_Code in (select Location_ID from user_mapping where user_id = userId)  else 1 end)
and (case when serviceCode <> '' then FIND_IN_SET (b.Service_code ,serviceCode)  else 1 end)
and (case when submittedTo <> '' then FIND_IN_SET (m.Submit_To_ID ,submittedTo)  else 1 end)
and (case when _vertical <> '' then FIND_IN_SET (v.Vertical_Id ,_vertical)  else 1 end)
and (case when billIds <> '' then FIND_IN_SET (b.BillDetails_ID ,billIds)  else 1 end)
and (case when locations <> '' then FIND_IN_SET (m.Submittion_Location_Code ,locations)  else 1 end)
and (case when startDate <> '' and endDate <> '' then (b.BillDate BETWEEN startDate AND endDate) else 1 end)
and (case when _status <> '' then FIND_IN_SET (b.status ,_status) else 1 end)
and (case when billDate <> ''  then b.BillDate =billDate else 1 end)
and (case when overDue <> '' then ( b.status <> 'S' and sysdate() > DATE_ADD(b.AcknowledgedOn , INTERVAL (ba.Credit_Period + 2) DAY))else 1 end)
and (case when onhold <> '' then (oh.Acc_Reason <> 'OK' and oh.Tax_Reason <> 'OK')  else 1 end)
and m.Memo_Number like concat(ifnull(memoNo, m.Memo_Number), '%')
and ba.BA_NAME like concat(ifnull(baName, ba.BA_NAME), '%')
and b.BillNo like concat(ifnull(billNo, b.BillNo), '%')
order by b.BillDate desc;
end if;
END$$

DELIMITER ;

