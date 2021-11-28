FROM node:16.10.0-buster as node_builder
WORKDIR /usr/src/app
COPY reactapp /usr/src/app
RUN ls -al
RUN yarn
RUN yarn build

FROM nginxinc/nginx-unprivileged:1.21

COPY --from=node_builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
