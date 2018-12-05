# codingmon
디비디비딥팀!

# 필수기능리스트
1. ~~**관리자** 로그인~~
2. ~~**사용자** 가입~~
  - ~~언어 능숙도~~
3. **관리자** 관리
  - ~~사용자 관리~~
  - ~~의뢰 관리~~
  - ~~팀 관리~~
  - 의뢰완료요청 관리
4. **프리랜서** 정보 수정
  - ~~개인 정보 수정~~
  - 내적 포트폴리오
  - 외적 포트폴리오
5. **프리랜서** ~~현재 구인중 의뢰 목록~~
  - ~~의뢰시작날짜, 의뢰금액 순 정렬~~
6. **프리랜서** ~~의뢰 신청~~
  - 최소 조건 체크
  - 신청 가능한 의뢰 목록
7. **프리랜서** 내 진행중 의뢰 및 정보
8. **프리랜서** 의뢰완료요청
9. **프리랜서** 수락시 의뢰자 평점 지정
10. ~~**의뢰자** 의뢰등록~~
  - 의뢰문서
  - ~~요구 능숙도~~
11. **의뢰자** 현재 진행중 의뢰 목록
  - 개발시작시간, 의뢰금액 순 정렬
12. **의뢰자** ~~신청자 목록~~
  - ~~프리랜서 경력, 능숙도, 평점, 포트폴리오 (프리랜서 프로필 링크)~~
  - ~~프리랜서 선택~~
  - 팀 경력, 능숙도, 평점, 포트폴리오
  - ~~팀 선택~~
13. **의뢰자** 의뢰완료요청 수락
  - 프리랜서 평점 지정
  - 수락 신호 전달
14. **의뢰자** 의뢰완료요청 거절
  - 거부 메시지 전달
15. **프리랜서** 거부 메시지 확인
  - 다시 완료 요청

# 시작하기

## 패키지 설치

>  npm install

명령어 치면 package.json에 써있는 대로 자동으로 설치함.

## 파일 준비

### config/database.js 파일 생성
```javascript
  module.exports = {
      host: 'localhost',
      user: 'root',
      password: 'DB 비밀번호',
      port: 3306,
      database: 'codingmon'
  };
```
user랑 password는 DB 계정정본데, 보통 루트 계정만 쓰니깐...  
port는 DB 포트인데, mysql이면 보통 3306  
database는 mysql의 스키마 선택인데, 프로젝트2 sql스크립트 쓰면 자동으로 codingmon 생김

### SQL 준비
#### MySQL 로그인
- cmd 에서 mysql -u root -p 입력
- 비밀번호 입력  

Mysql shell에서 
> source TEMP_PATH/database.sql ("sql_script_경로")

### 서버 시작
> npm start

## 서버 테스트
### 관리자 계정
> {id: 'admin', password: '123'}
