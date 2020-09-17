DELIMITER $$

DROP PROCEDURE IF EXISTS `SP_GetFromStateData` $$
CREATE PROCEDURE `SP_GetFromStateData`(
IN in_userID VARCHAR(50)
)
BEGIN

select S.State_ID, S.State_code, S.State_Name, S.UpdatedBy, S.UpdatedOn, S.IsActive, S.Plant_code, S.IsUT,b.ba_id
from users u inner join ba b
on u.user_name=b.ba_group_id
and b.isactive=1
inner join state s
on s.state_id=b.state_code
and s.isACTIVE=1
 where u.user_id= in_userID;

END $$

DELIMITER ;