DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_ChckIsInvoiceNumExists` $$
CREATE PROCEDURE `SP_ChckIsInvoiceNumExists`(
IN Inv_number   VARCHAR(50),
IN Ba_group_Id VARCHAR(50),
IN StartDate   VARCHAR(50),
IN EndDate VARCHAR(50)
)
BEGIN

declare IsInvExists Bool default false;
declare InvCnt int default 0;

-- Checking in draft first---------

select count(*) into InvCnt
from ba b inner join draft_bills db
on b.ba_id =db.ba_code
 where b.ba_group_id=Ba_group_Id-- 'A00348'
 and db.billno=Inv_number-- 'RNS-MTBDF200940';
and db.UpdatedOn >=StartDate -- '2020/04/01'
  and  db.UpdatedOn <= EndDate-- '2021/03/31'
  and db.status != 'C';

if(InvCnt=0)
then
-- If not in draft Checking in Billdetails ---------

select count(*) into InvCnt
from ba b inner join billdetails bd
on b.ba_id =bd.ba_code
where b.ba_group_id=Ba_group_Id-- 'A02720'
and bd.billno=Inv_number-- 'SCSL-335';
and bd.UpdatedOn >=StartDate -- '2020/04/01'
  and  bd.UpdatedOn <= EndDate-- '2021/03/31'
  and bd.status != 'C';
end if;


if(InvCnt>0)
then
set IsInvExists=true;
end if;

select IsInvExists;

END $$
DELIMITER;