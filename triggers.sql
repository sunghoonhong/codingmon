  /* after_freelancer_insert */
  /* freelancer에 insert 되면 f_rating_stat 테이블에 해당 id를 넣어줌 */
  /* freelancer 회원가입단계 적용(나중에 rating 계산을 위함)*/
DELIMITER $$
create trigger after_freelancer_insert
after insert on freelancer
FOR EACH ROW
BEGIN
	INSERT INTO f_rating_stat
	SET
	id = NEW.id;
END$$
DELIMITER ;

  /* after_client_insert */
  /* client에 insert 되면 c_rating_stat 테이블에 해당 id를 넣어줌 */
  /* client 회원가입단계 적용(나중에 rating 계산을 위함)*/
DELIMITER $$
create trigger after_client_insert
after insert on client
FOR EACH ROW
BEGIN
	INSERT INTO c_rating_stat
	SET
	c_rating_stat.id = NEW.id;
END $$
DELIMITER ;
 
 
 /* before_freelancer_insert */
 /* free lancer insert 전에 job_seeker 하나 만들어 주고 그거를 freelancer의 job_seeker_id에 넣어줌 */
 /* freelancer 회원가입단계 적용(freelancer job_seeker_id 설정)*/
DELIMITER $$
create trigger before_freelancer_insert
before insert on freelancer
FOR EACH ROW
BEGIN
	DECLARE JSI int;
	insert into job_seeker values();
	select job_seeker_id into JSI from job_seeker order by job_seeker_id desc limit 1;
	SET
	new.job_seeker_id = JSI;
END$$
DELIMITER ;
 
 
 /* after_owns_internal_insert */ 
/* owns_internal에 insert 되면 해당 결과보고서의 j_rating을 f_rating_stat에 넣어서 평균 계산하고 freelancer의 rating에 넣어줌 */
/* 내적포트폴리오가 생성 단계에 적용(새로운 내적 포트폴리오의 rating이 프리랜서의 rating에 업데이트 됨)  */
DELIMITER $$
 create trigger after_owns_internal_insert
 AFTER INSERT ON owns_internal
 FOR EACH ROW
 BEGIN
 
	declare average float(7,2);
	declare jrating float(7,2);
	select accepted.J_rating into jrating from accepted where accepted.arid = new.arid;

	UPDATE f_rating_stat
	SET 
	rating_sum = rating_sum + jrating,
	count_sum = count_sum + 1
	WHERE f_rating_stat.id = new.fid;
	
	select rating_sum / count_sum into average from f_rating_stat where f_rating_stat.id = new.fid;
	
	UPDATE f_rating_stat
	SET 
	avg_rating = average
	WHERE f_rating_stat.id = new.fid;
	
	UPDATE freelancer
	SET
	rating = average
	WHERE freelancer.id = new.fid;	
	
END $$
DELIMITER ;

 /* after_owns_internal_delete */ 
/* owns_internal에 delete 되면 해당 결과보고서의 j_rating을 f_rating_stat에서 빼서 평균 계산하고 freelancer의 rating에 넣어줌 */
/* 내적포트폴리오 지울 시에 적용(예전 내적 포트폴리오의 rating이 프리랜서의 rating에서 지워지는 걸로 업데이트 됨)  */
DELIMITER $$
 create trigger after_owns_internal_delete
 AFTER DELETE ON owns_internal
 FOR EACH ROW
 BEGIN
 
	declare average float(7,2);
	declare jrating float(7,2);
	select accepted.J_rating into jrating from accepted where accepted.arid = old.arid;

	UPDATE f_rating_stat
	SET 
	rating_sum = rating_sum - jrating,
	count_sum = count_sum - 1
	WHERE jrating is not null and f_rating_stat.id = old.fid;
	
	select rating_sum / count_sum into average from f_rating_stat where f_rating_stat.id = old.fid;
	
	UPDATE f_rating_stat
	SET 
	avg_rating = average
	WHERE jrating is not null and f_rating_stat.id = old.fid;
	
	UPDATE freelancer
	SET
	rating = average
	WHERE jrating is not null and freelancer.id = old.fid;	
	
END $$
DELIMITER ;


/* after_accepted_update */
/* ACCEPTED가 업데이트 되면 바뀐 RATING을 해당 프리랜서 또는 의뢰자의 평점에 적용해줌 */
/* (완료 신청을 의뢰자가 수락 후) 프리랜서가 의뢰자의 평점을 매긴 뒤에 CLIENT의 평점이 처음으로 업데이트 되는 것을 포함.  */
DELIMITER $$
create trigger after_accepted_update
after update on accepted
for each row
begin
	declare average float(7,2);
	declare requestrqid int;
	declare clientid VARCHAR(20);
	declare f_average float(7,2);
	declare freelancerid VARCHAR(20);
	
	select report.rqid into requestrqid from report where report.rid = new.arid;
	select request.cid into clientid from request where request.rqid = requestrqid;
	
	IF old.c_rating is null and new.c_rating>=0 and new.c_rating<=5  THEN
		update c_rating_stat
		set
		rating_sum = rating_sum + NEW.c_rating,
		count_sum = count_sum + 1
		where c_rating_stat.id = clientid;
		SELECT rating_sum / count_sum into average from c_rating_stat 
		where c_rating_stat.id = clientid;

		UPDATE c_rating_stat
		SET	
		avg_rating = average
		WHERE c_rating_stat.id = clientid;
		
		UPDATE client
		SET	
		rating = average
		WHERE client.id = clientid;

	ELSE 
		IF new.c_rating>=0 and new.c_rating<=5 and OLD.c_rating <> NEW.c_rating THEN
			update c_rating_stat
			set
			rating_sum = rating_sum - OLD.c_rating + NEW.c_rating,
			count_sum = count_sum
			where c_rating_stat.id = clientid;
			
			select rating_sum / count_sum into average from c_rating_stat 
			where c_rating_stat.id = clientid;
		
			UPDATE c_rating_stat
			SET	
			avg_rating = average
			WHERE c_rating_stat.id = clientid;
		
			UPDATE client
			SET	
			rating = average
			WHERE client.id = clientid;
		END IF;
	END IF;
	
	select owns_internal.fid into freelancerid from owns_internal where owns_internal.arid = old.arid;
	
	IF new.j_rating>=0 and new.j_rating<=5 and OLD.j_rating <> NEW.j_rating THEN
		UPDATE f_rating_stat
		SET 
		rating_sum = rating_sum - old.j_rating + new.j_rating,
		count_sum = count_sum
		WHERE f_rating_stat.id = freelancerid;
		
		select rating_sum / count_sum into f_average from f_rating_stat where f_rating_stat.id = freelancerid;
		
		UPDATE f_rating_stat
		SET 
		avg_rating = f_average
		WHERE f_rating_stat.id = freelancerid;
	
		UPDATE freelancer
		SET
		rating = f_average
		WHERE freelancer.id = freelancerid;	
		
	END IF;
	

END $$	
DELIMITER ;




/* before_accepted_delete */
/* accepted 가 delete 될 시에 client와 freelancer의 평점을 업데이트 함 */ 
/* 관리자가 accepted 중 하나를 지울 시에 적용 또는 해당 사용자가 삭제되어 accepted도 cascade로 삭제될 경우  */
DELIMITER $$
create trigger before_accepted_delete
before delete on accepted
for each row
begin
	declare c_average float(7,2);
	declare requestrqid int;
	declare clientid VARCHAR(20);
	declare f_average float(7,2);
	declare freelancerid VARCHAR(20);
	
	select report.rqid into requestrqid from report where report.rid = old.arid;
	select request.cid into clientid from request where request.rqid = requestrqid;

	update c_rating_stat
	set
	rating_sum = rating_sum - OLD.c_rating,
	count_sum = count_sum - 1
	where old.c_rating is not null and c_rating_stat.id = clientid;

	select rating_sum / count_sum into c_average from c_rating_stat where old.c_rating is not null and c_rating_stat.id = clientid;
	
	UPDATE c_rating_stat
	SET	
	avg_rating = c_average
	WHERE old.c_rating is not null and c_rating_stat.id = clientid;
	
	UPDATE client
	SET	
	rating = c_average
	WHERE old.c_rating is not null and client.id = clientid;
	
	
	select owns_internal.fid into freelancerid from owns_internal where owns_internal.arid = old.arid;
	
	UPDATE f_rating_stat
	SET 
	rating_sum = rating_sum - old.j_rating,
	count_sum = count_sum - 1
	WHERE old.j_rating is not null and f_rating_stat.id = freelancerid;
	
	select rating_sum / count_sum into f_average from f_rating_stat where f_rating_stat.id = freelancerid;
	
	UPDATE f_rating_stat
	SET 
	avg_rating = f_average
	WHERE old.j_rating is not null and f_rating_stat.id = freelancerid;
	
	UPDATE freelancer
	SET
	rating = f_average
	WHERE old.j_rating is not null and freelancer.id = freelancerid;	


END $$	
DELIMITER ;