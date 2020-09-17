DELIMITER $$

DROP FUNCTION IF EXISTS `fn_getParentServiceCatName` $$
CREATE FUNCTION `fn_getParentServiceCatName`(
in_ServiceCode int(10)
) RETURNS varchar(50) CHARSET latin1
BEGIN

 DECLARE v_ParentServiceName VARCHAR(50);

select s.Parent_service_name into v_ParentServiceName
from service_category s
where s.service_id=in_ServiceCode
and s.isACTIVE=1;

RETURN v_ParentServiceName;


END $$

DELIMITER ;