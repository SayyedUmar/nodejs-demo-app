USE `billhub`;
DROP procedure IF EXISTS `SP_getWithHoldingTaxByBa`;

DELIMITER $$
USE `billhub`$$
CREATE PROCEDURE `SP_getWithHoldingTaxByBa`(
IN ba_group_id VARCHAR(50)
)
BEGIN
SELECT distinct wht.`w/h_id` as whId,
wht.`w/h_tax_code` as whTaxCode,
wht.`w/h_tax_type` as whTaxType,
wht.`tax_rate` as whTaxRate
,concat(wht.`w/h_tax_type`,'-',wht.`w/h_tax_code`,'-',wht.`tax_rate`,'%')
as whTaxString FROM billhub.`ba_w/h_mapping` whm
inner join withholding_tax wht on whm.WH_Tax_ID = wht.`w/h_id`
inner join ba b on b.BA_GROUP_ID =whm.BA_GROUP_ID
where b.ba_id = ba_group_id and wht.description = 'Invoices';

END$$

DELIMITER ;

