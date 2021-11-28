#/bin/bash

mkdir ${DOCKERFILES_FOLDER}/${NAME}
echo "FROM ${BASE_IMAGE}" > ${DOCKERFILES_FOLDER}/${NAME}/Dockerfile
echo "SERVICE_NAME=${NAME}
CONTAINER_NAME=${NAME}" > ${DOCKERFILES_FOLDER}/${NAME}/Makefile.conf
echo "include ../_include/skeleton.mk" > ${DOCKERFILES_FOLDER}/${NAME}/Makefile
