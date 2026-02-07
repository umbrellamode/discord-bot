FROM denoland/deno:2.1.4

WORKDIR /app

COPY deno.json .
COPY src/ src/

RUN deno cache src/index.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "src/index.ts"]
