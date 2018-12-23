CREATE DATABASE  IF NOT EXISTS `codingmon` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */;
USE `codingmon`;
-- MySQL dump 10.13  Distrib 8.0.12, for Win64 (x86_64)
--
-- Host: localhost    Database: codingmon
-- ------------------------------------------------------
-- Server version	8.0.12

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accepted`
--

DROP TABLE IF EXISTS `accepted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `accepted` (
  `arid` int(11) NOT NULL,
  `j_rating` float(7,2) DEFAULT NULL,
  `c_rating` float(7,2) DEFAULT NULL,
  PRIMARY KEY (`arid`),
  CONSTRAINT `accepted_ibfk_1` FOREIGN KEY (`arid`) REFERENCES `report` (`rid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accepted`
--

LOCK TABLES `accepted` WRITE;
/*!40000 ALTER TABLE `accepted` DISABLE KEYS */;
/*!40000 ALTER TABLE `accepted` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_accepted_update` AFTER UPDATE ON `accepted` FOR EACH ROW BEGIN
	declare theclientid varchar(100);
	declare newrating float(7,2);
	
	select req.cid into theclientid from report rep, request req
	where rep.rid = new.arid and req.rqid = rep.rqid;
	select avg(c_rating) into newrating from accepted ar, report rep, request req
	where req.cid = theclientid and rep.rqid = req.rqid and ar.arid = rep.rid;
 
 	update client
	set
	rating = newrating
	where id = theclientid;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_accepted_delete` BEFORE DELETE ON `accepted` FOR EACH ROW BEGIN
	DELETE FROM owns_internal where owns_internal.arid = old.arid;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_accepted_delete` AFTER DELETE ON `accepted` FOR EACH ROW BEGIN
	declare theclientid varchar(100);
	declare newrating float(7,2);
	
	select req.cid into theclientid from report rep, request req
	where rep.rid = OLD.arid and req.rqid = rep.rqid;
	select avg(c_rating) into newrating from accepted ar, report rep, request req
	where req.cid = theclientid and rep.rqid = req.rqid and ar.arid = rep.rid;
 
 	update client
	set
	rating = newrating
	where id = theclientid;
	
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `admin` (
  `id` varchar(20) NOT NULL,
  `password` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES ('admin','123');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applys`
--

DROP TABLE IF EXISTS `applys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `applys` (
  `rqid` int(11) NOT NULL,
  `job_seeker_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'waiting',
  PRIMARY KEY (`rqid`,`job_seeker_id`),
  KEY `job_seeker_id` (`job_seeker_id`),
  CONSTRAINT `applys_ibfk_1` FOREIGN KEY (`rqid`) REFERENCES `request` (`rqid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applys_ibfk_2` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seeker` (`job_seeker_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applys`
--

LOCK TABLES `applys` WRITE;
/*!40000 ALTER TABLE `applys` DISABLE KEYS */;
/*!40000 ALTER TABLE `applys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `client` (
  `id` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `name` varchar(20) NOT NULL,
  `phone_num` char(13) NOT NULL,
  `rating` float(7,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `declined`
--

DROP TABLE IF EXISTS `declined`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `declined` (
  `drid` int(11) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`drid`),
  CONSTRAINT `declined_ibfk_1` FOREIGN KEY (`drid`) REFERENCES `report` (`rid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `declined`
--

LOCK TABLES `declined` WRITE;
/*!40000 ALTER TABLE `declined` DISABLE KEYS */;
/*!40000 ALTER TABLE `declined` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document`
--

DROP TABLE IF EXISTS `document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `document` (
  `did` int(11) NOT NULL AUTO_INCREMENT,
  `dfile` varchar(100) NOT NULL,
  `rqid` int(11) NOT NULL,
  PRIMARY KEY (`did`),
  KEY `rqid` (`rqid`),
  CONSTRAINT `document_ibfk_1` FOREIGN KEY (`rqid`) REFERENCES `request` (`rqid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document`
--

LOCK TABLES `document` WRITE;
/*!40000 ALTER TABLE `document` DISABLE KEYS */;
/*!40000 ALTER TABLE `document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `freelancer`
--

DROP TABLE IF EXISTS `freelancer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `freelancer` (
  `id` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `name` varchar(20) NOT NULL,
  `phone_num` char(13) NOT NULL,
  `rating` float(7,2) DEFAULT NULL,
  `age` int(11) NOT NULL,
  `major` varchar(20) NOT NULL,
  `career` int(11) NOT NULL,
  `job_seeker_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `job_seeker_id` (`job_seeker_id`),
  CONSTRAINT `freelancer_ibfk_1` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seeker` (`job_seeker_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `freelancer`
--

LOCK TABLES `freelancer` WRITE;
/*!40000 ALTER TABLE `freelancer` DISABLE KEYS */;
/*!40000 ALTER TABLE `freelancer` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_freelancer_delete` BEFORE DELETE ON `freelancer` FOR EACH ROW BEGIN
	DELETE FROM participates where fid = old.id;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `job_seeker`
--

DROP TABLE IF EXISTS `job_seeker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `job_seeker` (
  `job_seeker_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`job_seeker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_seeker`
--

LOCK TABLES `job_seeker` WRITE;
/*!40000 ALTER TABLE `job_seeker` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_seeker` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knows`
--

DROP TABLE IF EXISTS `knows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `knows` (
  `job_seeker_id` int(11) NOT NULL,
  `lang_name` varchar(20) NOT NULL,
  `level` int(11) NOT NULL,
  PRIMARY KEY (`job_seeker_id`,`lang_name`),
  KEY `lang_name` (`lang_name`),
  CONSTRAINT `knows_ibfk_1` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seeker` (`job_seeker_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `knows_ibfk_2` FOREIGN KEY (`lang_name`) REFERENCES `program_lang` (`lang_name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knows`
--

LOCK TABLES `knows` WRITE;
/*!40000 ALTER TABLE `knows` DISABLE KEYS */;
/*!40000 ALTER TABLE `knows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `owns_external`
--

DROP TABLE IF EXISTS `owns_external`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `owns_external` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `efile` varchar(100) NOT NULL,
  `fid` varchar(20) NOT NULL,
  PRIMARY KEY (`pid`),
  KEY `fid` (`fid`),
  CONSTRAINT `owns_external_ibfk_1` FOREIGN KEY (`fid`) REFERENCES `freelancer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `owns_external`
--

LOCK TABLES `owns_external` WRITE;
/*!40000 ALTER TABLE `owns_external` DISABLE KEYS */;
/*!40000 ALTER TABLE `owns_external` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `owns_internal`
--

DROP TABLE IF EXISTS `owns_internal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `owns_internal` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `fid` varchar(20) NOT NULL,
  `arid` int(11) NOT NULL,
  PRIMARY KEY (`pid`),
  KEY `fid` (`fid`),
  KEY `arid` (`arid`),
  CONSTRAINT `owns_internal_ibfk_1` FOREIGN KEY (`fid`) REFERENCES `freelancer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `owns_internal_ibfk_2` FOREIGN KEY (`arid`) REFERENCES `accepted` (`arid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `owns_internal`
--

LOCK TABLES `owns_internal` WRITE;
/*!40000 ALTER TABLE `owns_internal` DISABLE KEYS */;
/*!40000 ALTER TABLE `owns_internal` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_owns_internal_insert` AFTER INSERT ON `owns_internal` FOR EACH ROW BEGIN
	declare newrating float(7,2);
	
	select AVG(j_rating) into newrating from accepted ar, owns_internal oi
	where oi.fid = new.fid and oi.arid = ar.arid;
 
 
	update freelancer
	set
	rating = newrating
	where id = new.fid;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_owns_internal_delete` AFTER DELETE ON `owns_internal` FOR EACH ROW BEGIN
	declare newrating float(7,2);
	

	select AVG(j_rating) into newrating from accepted ar, owns_internal oi
	where oi.fid = old.fid and oi.arid = ar.arid;

	update freelancer
	set
	rating = newrating
	where id = old.fid;

 
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `participates`
--

DROP TABLE IF EXISTS `participates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `participates` (
  `fid` varchar(20) NOT NULL,
  `tname` varchar(20) NOT NULL,
  PRIMARY KEY (`fid`,`tname`),
  KEY `tname` (`tname`),
  CONSTRAINT `participates_ibfk_1` FOREIGN KEY (`fid`) REFERENCES `freelancer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `participates_ibfk_2` FOREIGN KEY (`tname`) REFERENCES `team` (`tname`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participates`
--

LOCK TABLES `participates` WRITE;
/*!40000 ALTER TABLE `participates` DISABLE KEYS */;
/*!40000 ALTER TABLE `participates` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_participates_insert` AFTER INSERT ON `participates` FOR EACH ROW BEGIN
	declare mincareer int;

	declare teamjsi int;
	declare freejsi int;
	declare pnum int;

	declare checknum int;
	declare beforewhat VARCHAR(20);
	declare what VARCHAR(20);
	
	declare freelevel int;
	declare teamlevel int;
	declare sumpeople int;
	
	select MIN(career) into mincareer from freelancer f, participates p 
	where f.id = p.fid and p.tname = new.tname;
	
	select count(*) into sumpeople from participates p where p.tname = new.tname;
	update team
	set
	people_num = sumpeople,
	career = mincareer
	where team.tname = new.tname;
	
	
	select t.job_seeker_id into teamjsi from team t
	where t.tname = new.tname;
	
	select f.job_seeker_id into freejsi from freelancer f
	where f.id = new.fid;
	
	select t.people_num into pnum from team t
	where t.tname = new. tname;
	
	if pnum = 1 then
		set checknum =1;
		loop_initeam:LOOP	
		
		
			select * into what from (select * from program_lang order by lang_name desc limit checknum) as temp order by lang_name asc limit 1;
		
			IF what = beforewhat then
				leave loop_initeam;
			END IF;
		
			insert into knows(job_seeker_id, lang_name, level) values (teamjsi, what , 0);
			set beforewhat = what;
			set checknum = (checknum + 1);
		
	
		END LOOP;
	END IF;
	
	set checknum =1;
	set beforewhat = null;
	loop_update:LOOP
	
		select * into what from (select * from program_lang order by lang_name desc limit checknum) as temp order by lang_name asc limit 1; 
		
		IF what = beforewhat then
			leave loop_update;
		END IF;
		
		select level into freelevel from knows where knows.job_seeker_id = freejsi and knows.lang_name = what;
		select level into teamlevel from knows where knows.job_seeker_id = teamjsi and knows.lang_name = what;
		
		if freelevel > teamlevel then
			update knows set level = freelevel where job_seeker_id = teamjsi and lang_name = what;
		END IF;
		set beforewhat = what;
		set checknum = (checknum + 1);
		
	END LOOP;
	
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_participates_delete` AFTER DELETE ON `participates` FOR EACH ROW BEGIN
	declare mincareer int;
	
	declare teamjsi int;
	declare freejsi int;

	declare checknum int;
	declare beforewhat VARCHAR(20);
	declare what VARCHAR(20);
	
	declare freelevel int;
	declare teamlevel int;
		
	declare peoplenum int;
	declare freeid varchar(20);
	declare beforefreeid varchar(20);
	declare sumpeople int;
	
	select MIN(career) into mincareer from freelancer f, participates p 
	where f.id = p.fid and p.tname = old.tname;

	select count(*) into sumpeople from participates p where p.tname = old.tname;
	
	update team
	set
	people_num = sumpeople,
	career = mincareer
	where team.tname = old.tname;
	
	select t.job_seeker_id into teamjsi from team t
	where t.tname = old.tname;
	
	
	set checknum =1;
	loop_initeam:LOOP	
		
		select * into what from (select * from program_lang order by lang_name desc limit checknum) as temp order by lang_name asc limit 1;
		
		IF what = beforewhat then
			leave loop_initeam;
		END IF;
		
		update knows set level = 0 where job_seeker_id = teamjsi and lang_name = what;
		set beforewhat = what;
		set checknum = (checknum + 1);	
	
	END LOOP;
	
	set peoplenum = 1;
	loop_allpeople:LOOP
		select * into freeid from (select fid from participates where tname = old.tname order by fid desc limit peoplenum) as temp2 order by fid asc limit 1;
		
		IF freeid = beforefreeid THEN
			leave loop_allpeople;
		END IF;
		
		select f.job_seeker_id into freejsi from freelancer f where f.id = freeid;
		
		set checknum =1;
		set beforewhat = null;
		loop_update:LOOP
	
			select * into what from (select * from program_lang order by lang_name desc limit checknum) as temp order by lang_name asc limit 1; 
		
			IF what = beforewhat then
				leave loop_update;
			END IF;
		
			select level into freelevel from knows where knows.job_seeker_id = freejsi and knows.lang_name = what;
			select level into teamlevel from knows where knows.job_seeker_id = teamjsi and knows.lang_name = what;
		
			if freelevel > teamlevel then
				update knows set level = freelevel where job_seeker_id = teamjsi and lang_name = what;
			END IF;
			set beforewhat = what;
			set checknum = (checknum + 1);
		
		END LOOP;
		
		set beforefreeid = freeid;
		set peoplenum = (peoplenum +1);
	END LOOP;
	
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `program_lang`
--

DROP TABLE IF EXISTS `program_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `program_lang` (
  `lang_name` varchar(20) NOT NULL,
  PRIMARY KEY (`lang_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_lang`
--

LOCK TABLES `program_lang` WRITE;
/*!40000 ALTER TABLE `program_lang` DISABLE KEYS */;
INSERT INTO `program_lang` VALUES ('C'),('Java'),('JavaScript'),('Python');
/*!40000 ALTER TABLE `program_lang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `report` (
  `rid` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL DEFAULT 'waiting',
  `rfile` varchar(100) NOT NULL,
  `rqid` int(11) NOT NULL,
  `job_seeker_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`rid`),
  KEY `job_seeker_id` (`job_seeker_id`),
  KEY `rqid` (`rqid`),
  CONSTRAINT `report_ibfk_1` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seeker` (`job_seeker_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `report_ibfk_2` FOREIGN KEY (`rqid`) REFERENCES `request` (`rqid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_report_delete` BEFORE DELETE ON `report` FOR EACH ROW BEGIN
	DELETE FROM accepted where accepted.arid = old.rid;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `request`
--

DROP TABLE IF EXISTS `request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `request` (
  `rqid` int(11) NOT NULL AUTO_INCREMENT,
  `cid` varchar(20) DEFAULT NULL,
  `rname` varchar(100) NOT NULL,
  `reward` int(11) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `dev_start` datetime DEFAULT NULL,
  `dev_end` datetime DEFAULT NULL,
  `min_people` int(11) NOT NULL,
  `max_people` int(11) NOT NULL,
  `min_career` int(11) NOT NULL,
  PRIMARY KEY (`rqid`),
  KEY `cid` (`cid`),
  CONSTRAINT `request_ibfk_1` FOREIGN KEY (`cid`) REFERENCES `client` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request`
--

LOCK TABLES `request` WRITE;
/*!40000 ALTER TABLE `request` DISABLE KEYS */;
/*!40000 ALTER TABLE `request` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = euckr */ ;
/*!50003 SET character_set_results = euckr */ ;
/*!50003 SET collation_connection  = euckr_korean_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_request_delete` BEFORE DELETE ON `request` FOR EACH ROW BEGIN
	DELETE FROM report where report.rqid = old.rqid;
 
 END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `requires`
--

DROP TABLE IF EXISTS `requires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `requires` (
  `rqid` int(11) NOT NULL,
  `lang_name` varchar(20) NOT NULL,
  `level` int(11) NOT NULL,
  PRIMARY KEY (`rqid`,`lang_name`),
  KEY `lang_name` (`lang_name`),
  CONSTRAINT `requires_ibfk_1` FOREIGN KEY (`rqid`) REFERENCES `request` (`rqid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `requires_ibfk_2` FOREIGN KEY (`lang_name`) REFERENCES `program_lang` (`lang_name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requires`
--

LOCK TABLES `requires` WRITE;
/*!40000 ALTER TABLE `requires` DISABLE KEYS */;
/*!40000 ALTER TABLE `requires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `team` (
  `tname` varchar(20) NOT NULL,
  `career` int(11) DEFAULT NULL,
  `mgr_id` varchar(20) NOT NULL,
  `people_num` int(11) DEFAULT '0',
  `job_seeker_id` int(11) NOT NULL,
  PRIMARY KEY (`tname`),
  KEY `mgr_id` (`mgr_id`),
  KEY `job_seeker_id` (`job_seeker_id`),
  CONSTRAINT `team_ibfk_1` FOREIGN KEY (`mgr_id`) REFERENCES `freelancer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `team_ibfk_2` FOREIGN KEY (`job_seeker_id`) REFERENCES `job_seeker` (`job_seeker_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-12-12 20:37:39
