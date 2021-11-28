# build mapbender-server base image
FROM php:7.4-apache-buster as backend-server

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
		zlib1g-dev \
    libzip-dev \
		libbz2-dev \
    libxml2-dev \
		libwebp-dev \
		libjpeg-dev \
		libpng-dev \
		libxmp-dev \
		libicu-dev \
		#libsqlite3-dev \
    libpq-dev \
    libonig-dev \
    libgeos-dev \
    && docker-php-ext-install zip \
	  && docker-php-ext-install bz2 \
	  && docker-php-ext-install xml \
	  && docker-php-ext-install json \
	  && docker-php-ext-install mbstring \
	  && docker-php-ext-install gd \
	  && docker-php-ext-install intl \
	  #&& docker-php-ext-install pdo_sqlite \
	  && docker-php-ext-install pdo \
	  #&& docker-php-ext-install pdo_mysql \
	  && docker-php-ext-install pdo_pgsql \
    && docker-php-ext-install opcache

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

FROM backend-server as backend-builder

# install build dependencies
#RUN apt-get update \
#    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
#    git \
#    ssh-client

COPY symfony /var/vhosts/backend

RUN cd /var/vhosts/backend \
    && composer install -o \
    && bin/console assets:install --symlink --relative \
    && cd .. \
    && chown www-data:www-data ./ -R \
    && ls -al backend


# start building the final image
FROM backend-server

RUN a2enmod headers deflate rewrite remoteip && rm /etc/apache2/sites-enabled/*

COPY --from=backend-builder ./var/vhosts/backend /var/vhosts/backend
RUN ls -al /var/vhosts/backend

COPY ./conf/php.ini /usr/local/etc/php/php.ini
COPY ./conf/vhost.conf /etc/apache2/sites-enabled/vhost.conf

USER www-data
WORKDIR /var/vhosts/backend
