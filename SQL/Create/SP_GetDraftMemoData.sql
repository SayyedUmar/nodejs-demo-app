DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_GetDraftMemoData` $$
CREATE PROCEDURE `SP_GetDraftMemoData`(
IN ba_group_id   VARCHAR(50)
,IN memo_id VARCHAR(50),
 IN from_State VARCHAR(50),
IN to_State  VARCHAR(50))
BEGIN

declare v_conditionChk int default 0;

 SET session sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY,',''));

SET @t1 =CONCAT("SELECT d.draft_bill_id,d.Ba_code,d.MemoID,d.Billing_From_code,d.Billing_To_code, fn_getStateName(d.Billing_From_code) as Billing_From_state,fn_getStateName(d.Billing_To_code) as Billing_To_state, ");

SET @t1 = CONCAT(@t1,"count(d.draft_bill_id) as no_of_invs,d.updatedon as created_on FROM ba b inner join draft_bills d on d.ba_code=b.ba_id where 1=1");


if(ba_group_id!='' || ba_group_id!=null) then
set @t1=concat(@t1," and upper(b.ba_group_id) = upper('",ba_group_id,"')");
set v_conditionChk=1;
end if;

if(memo_id!='' || memo_id!=null) then
set @t1=concat(@t1," and upper(d.memoid) = upper('",memo_id,"')");
set v_conditionChk=2;
end if;

if(from_State!='' || from_State!=null) then
set @t1=concat(@t1," and d.billing_from_code = ",from_State);
set v_conditionChk=3;
end if;

if(to_State!='' || to_State!=null) then
set @t1=concat(@t1," and d.billing_to_code = ",to_State);
set v_conditionChk=4;
end if;

SET @t1 = CONCAT(@t1," and ",v_conditionChk," in (1,2,3,4)");-- to check atleast for one condition(should not be 0)

SET @t1 = CONCAT(@t1," group by d.Billing_From_code,d.Billing_To_code, d.MemoID,d.BA_Code;");

-- SET @t1 = CONCAT(" select * from draft_bills where 1=2;");

-- select @t1;
PREPARE stmt FROM @t1;
 EXECUTE stmt;

END $$

DELIMITER ;