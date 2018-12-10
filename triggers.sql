   /* before_job_seeker_delete */
 DELIMITER $$
 create trigger before_job_seeker_delete
 BEFORE DELETE ON job_seeker
 FOR EACH ROW
 BEGIN
	DELETE FROM report where report.job_seeker_id = old.job_seeker_id;
 
 END $$
 DELIMITER ;
 
       /* after_client_delete */
 /*DELIMITER $$
 create trigger after_client_delete
 AFTER DELETE ON client
 FOR EACH ROW
 BEGIN
	DELETE FROM request where request.cid = old.id;
 
 END $$
 DELIMITER ;*/
 
      /* before_request_delete  */
 DELIMITER $$
 create trigger before_request_delete
 BEFORE DELETE ON request
 FOR EACH ROW
 BEGIN
	DELETE FROM report where report.rqid = old.rqid;
 
 END $$
 DELIMITER ;
 
   /* before_report_delete */
 DELIMITER $$
 create trigger before_report_delete
 BEFORE DELETE ON report
 FOR EACH ROW
 BEGIN
	DELETE FROM accepted where accepted.arid = old.rid;
 
 END $$
 DELIMITER ;

  /* before_accepted_delete */
 DELIMITER $$
 create trigger before_accepted_delete
 BEFORE DELETE ON accepted
 FOR EACH ROW
 BEGIN
	DELETE FROM owns_internal where owns_internal.arid = old.arid;
 
 END $$
 DELIMITER ;

   /* after_accepted_delete */
 DELIMITER $$
 create trigger after_accepted_delete
 AFTER DELETE ON accepted
 FOR EACH ROW
 BEGIN
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
	
 
 END $$
 DELIMITER ;
 
   /* after_accepted_update */
 DELIMITER $$
 create trigger after_accepted_update
 AFTER UPDATE ON accepted
 FOR EACH ROW
 BEGIN
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
 
 END $$
 DELIMITER ;

 
 /* after_owns_internal_insert */ 
 DELIMITER $$
 create trigger after_owns_internal_insert
 AFTER INSERT ON owns_internal
 FOR EACH ROW
 BEGIN
	declare newrating float(7,2);
	
	select AVG(j_rating) into newrating from accepted ar, owns_internal oi
	where oi.fid = new.fid and oi.arid = ar.arid;
 
 
	update freelancer
	set
	rating = newrating
	where id = new.fid;
 
 END $$
 DELIMITER ;

  /* after_owns_internal_delete */ 
 DELIMITER $$
 create trigger after_owns_internal_delete
 AFTER DELETE ON owns_internal
 FOR EACH ROW
 BEGIN
	declare newrating float(7,2);
	

	select AVG(j_rating) into newrating from accepted ar, owns_internal oi
	where oi.fid = old.fid and oi.arid = ar.arid;

	update freelancer
	set
	rating = newrating
	where id = old.fid;

 
 
 END $$
 DELIMITER ;


/*  TEAM TEAM TEAM TEAM TEAM TEAM TEAM TEAM TEAM TEAM TEAM TEAM */
/* 팀원 추가시 해당 팀의 career , people_num update */
DELIMITER $$
create trigger after_participates_insert
after insert on participates
FOR EACH ROW
BEGIN
	declare mincareer int;
	
	select MIN(career) into mincareer from freelancer f, participates p 
	where f.id = p.fid and p.tname = new.tname;
	
	update team
	set
	people_num = people_num + 1,
	career = mincareer
	where team.tname = new.tname;
	
END $$
DELIMITER ;



/* 팀원 삭제시 해당 팀의 career , people_num update */
DELIMITER $$
create trigger after_participates_delete
after delete on participates
FOR EACH ROW
BEGIN
	declare mincareer int;
	
	select MIN(career) into mincareer from freelancer f, participates p 
	where f.id = p.fid and p.tname = old.tname;
	
	update team
	set
	people_num = people_num -1,
	career = mincareer
	where team.tname = old.tname;
	
END $$
DELIMITER ;

/* testing zone */
