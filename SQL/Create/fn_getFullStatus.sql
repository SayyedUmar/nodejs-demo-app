USE `billhub`;
DROP function IF EXISTS `fn_getFullStatus`;

DELIMITER $$
USE `billhub`$$
CREATE FUNCTION `fn_getFullStatus`(st char(1)) RETURNS varchar(50) CHARSET latin1
BEGIN

set @result = (select case 
when st = 'C' then 'Rejected'
when st = 'R' then 'Requested'
when st = 'P' then 'Payment'
when st = 'S' then 'Submitted'
when st = 'B' then 'Booked'
when st = 'A' then 'Acknowledged'
when st = 'V' then 'Verified'
else st
end);

RETURN @result;
END$$

DELIMITER ;

