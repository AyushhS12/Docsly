FROM rust:alpine3.23

WORKDIR /usr/src/app

ENV ENV=prod

ENV RUST_LOG=debug

#Change when deployed to production
ENV JWT_SECRET=none

ENV MONGO_URI=mongodb://localhost:27107/

COPY . .

EXPOSE 7878

RUN cargo build --release

CMD [ "./target/release/Docsly" ]