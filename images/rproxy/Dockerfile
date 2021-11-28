ARG BASEIMAGE_NAME=httpd
ARG BASEIMAGE_TAG=2.4
FROM ${BASEIMAGE_NAME}:${BASEIMAGE_TAG}

RUN rm -rf /usr/local/apache2/conf/extra/*

COPY ./ssl/new.cert.cert /etc/apache2/ssl/cert.cert
COPY ./ssl/new.cert.key /etc/ssl/private/cert.key
COPY ./assets/.htpasswd /etc/apache2/httpbasicauth/.htpasswd

COPY ./etc/apache2/httpd.conf /usr/local/apache2/conf/httpd.conf
COPY ./etc/apache2/extra/*.conf /usr/local/apache2/conf/extra/
COPY ./htdocs/* /usr/local/apache2/htdocs/
