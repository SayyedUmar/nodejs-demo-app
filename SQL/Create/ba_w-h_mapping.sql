
CREATE TABLE  `ba_w/h_mapping` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Ba_Group_ID` char(20) NOT NULL,
  `WH_Tax_ID` int(10) NOT NULL,
  `Updated_By` int(10) DEFAULT '0',
  `Updated_On` datetime DEFAULT NULL,
  `Is_Active` int(10) DEFAULT '0',
  PRIMARY KEY (`ID`)
);