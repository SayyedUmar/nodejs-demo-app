USE `billhub`;
DROP procedure IF EXISTS `sp_getBillsFromMemo`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `sp_getBillsFromMemo`(in userId int(11),
memoId int(10),
parentId varchar(45))
BEGIN

select 
m.Memo_ID as memoId,
m.Memo_Number as memoNumber,
m.Memo_Date as memoDate,
m.Submittion_Location_Code as submittionLocationCode,
l.Location_Name as submittionLocationState,
m.Submit_To_ID as submitToId,
m.BA_Code as baCode,
b.BA_NAME as baName,
concat(u.First_Name,' ',u.Last_Name) as submitToName,
DATE_FORMAT(m.CreatedOn, "%Y-%m-%d") as submittedAt
from memodetails m
inner join users u on u.User_ID =m.Submit_To_ID
inner join ba b on b.BA_ID = m.BA_CODE
inner join location l on l.Location_ID = m.Submittion_Location_Code
where m.Memo_ID = memoId and
case when userId <> 0 then
m.Submittion_Location_Code in (select Location_ID from user_mapping
where user_id = userId)
else 1
end
and 
case when parentId <> '' then b.BA_GROUP_ID = parentId
else 1 end;

select b.BillDetails_ID as billId,
b.MemoID as memoId,
b.BillNo as billNo,
b.BillDate as billDate,
b.Billing_From_code as billingFromCode,
fn_getStateName(b.Billing_From_code) as billingFromState,
b.Billing_To_code as billingToCode,
fn_getStateName(b.Billing_From_code) as billingToState,
b.HSN_Code as hsnCode,
fn_getFullStatus(b.status) as status,
b.Service_code AS serviceCode,
sc.Service_Name as serviceName,
sc.Parent_Service_Name as parentServiceName,
b.Comments AS comments,
b.CGST AS cgst,
b.SGST AS sgst,
b.IGST AS igst,
b.TaxableAmount AS baseAmount,
b.Additional_Amount as additionalAmount,
b.Trade_Discount as tradeDiscount,
b.Amount as totalAmount,
b.AcknowledgedOn as acknowledgedDate,
b.inv_source as invSource,
b.isPO
from billdetails b
inner join service_category sc on sc.Service_ID = b.Service_code
where b.MemoID = memoId;


END$$

DELIMITER ;