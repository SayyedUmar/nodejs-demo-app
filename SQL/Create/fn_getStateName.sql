DELIMITER $$

DROP FUNCTION IF EXISTS `fn_getStateName` $$
CREATE FUNCTION `fn_getStateName`(
in_StateID int(10)
) RETURNS varchar(50) CHARSET latin1
BEGIN

 DECLARE v_StateName VARCHAR(50);

select S.State_Name into v_StateName
from state s
where s.state_id=in_StateID
and s.isACTIVE=1;

RETURN v_StateName;


END $$

DELIMITER ;