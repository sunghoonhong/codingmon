 /* 디비디비딥 팀 데이터베이스 프로젝트 triggers.sql */
 /* 프로젝트에 사용된 트리거들을 저장해놓은 파일입니다. */

 /* 의뢰 지우기 전, 해당 의뢰를 참조하는 report(결과보고서)를 지우는 트리거  */
 /* cascade로 결과보고서가 지워질 경우, 
   평점 업데이트하는 트리거가 작동되지 않기 때문에 의뢰 지우기 전에 트리거로 결과보고서를 지워줌 */
 /* before_request_delete */
 DELIMITER $$
 create trigger before_request_delete
 BEFORE DELETE ON request
 FOR EACH ROW
 BEGIN
	DELETE FROM report where report.rqid = old.rqid;
 
 END $$
 DELIMITER ;
 
 /* 결과보고서 지우기 전, 해당 결과보고서를 참조하는 accepted(승인된 결과보고서)를 지우는 트리거  */
 /* cascade로 승인된 결과보고서가 지워질 경우, 
   평점 업데이트하는 트리거가 작동되지 않기 때문에 결과보고서를 지우기 전에 트리거로 승인된 결과보고서를 지워줌 */
 /* before_report_delete */
 DELIMITER $$
 create trigger before_report_delete
 BEFORE DELETE ON report
 FOR EACH ROW
 BEGIN
	DELETE FROM accepted where accepted.arid = old.rid;
 
 END $$
 DELIMITER ;

 /* accepted(승인된 결과보고서) 지우기 전, 해당 승인된 결과보고서를 참조하는 owns_internal(내적포트폴리오)를 지우는 트리거 */
 /* cascade로 owns_internal(내적포트폴리오)가 지워질 경우, 
    평점 업데이트하는 트리거가 작동되지 않기 때문에 승인된 결과보고서를 지우기 전에 트리거로 내적포트폴리오를 지워줌 */
 /* before_accepted_delete */
 DELIMITER $$
 create trigger before_accepted_delete
 BEFORE DELETE ON accepted
 FOR EACH ROW
 BEGIN
	DELETE FROM owns_internal where owns_internal.arid = old.arid;
 
 END $$
 DELIMITER ;

 /* accepted(승인된 결과보고서)가 지워진 뒤, 영향을 받는 의뢰자의 평점을 업데이트하는 트리거 */
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
 
 /* 프리랜서가 의뢰자의 평점을 준 뒤, 해당 의뢰자의 평점을 업데이트하는 트리거 */
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

 /* 내적포트폴리오 삭제 후, 해당 프리랜서의 평점을 업데이트하는 트리거 */
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

 /* 내적포트폴리오 입력 후, 해당 프리랜서의 평점을 업데이트하는 트리거 */
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


 /* 이하 팀기능 관련 트리거 */

 /* 팀원 추가시 해당 팀의 최소 경력(career), 인원 수(people_num), 언어별 최대 능숙도(knows) 업데이트하는 트리거 */
 /* after_participates_insert */
 DELIMITER $$
 create trigger after_participates_insert
 after insert on participates
 FOR EACH ROW
 BEGIN
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
	
 END $$
 DELIMITER ;


 /* 팀원 삭제시 해당 팀의 최소 경력(career), 인원 수(people_num), 언어별 최대 능숙도(knows) 업데이트하는 트리거 */
 /* after_participates_delete */
 DELIMITER $$
 create trigger after_participates_delete
 after delete on participates
 FOR EACH ROW
 BEGIN
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
	
 END $$
 DELIMITER ;