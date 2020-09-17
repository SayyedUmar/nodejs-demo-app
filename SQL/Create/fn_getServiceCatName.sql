DELIMITER $$

DROP FUNCTION IF EXISTS `fn_getServiceCatName` $$
CREATE FUNCTION `fn_getServiceCatName`(
in_ServiceCode int(10)
) RETURNS varchar(50) CHARSET latin1
BEGIN

 DECLARE v_ServiceName VARCHAR(50);

select s.service_name into v_ServiceName
from service_category s
where s.service_id=in_ServiceCode
and s.isACTIVE=1;

RETURN v_ServiceName;


END $$

DELIMITER ;