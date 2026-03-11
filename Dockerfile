FROM nginx:alpine
# Railway에서 할당하는 PORT 환경변수를 Nginx 설정에 적용하기 위한 템플릿 복사
COPY default.conf.template /etc/nginx/templates/default.conf.template
# HTML 등 모든 프로젝트 파일을 Nginx 기본 서빙 폴더로 복사
COPY . /usr/share/nginx/html
