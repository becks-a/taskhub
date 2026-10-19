FROM python:3.12-alpine

RUN apk add --no-cache bash curl

WORKDIR /app

COPY health-check.sh alert.py ./

RUN chmod +x health-check.sh \
    && addgroup -S monitor \
    && adduser -S monitor -G monitor \
    && chown -R monitor:monitor /app

USER monitor

CMD ["python3", "alert.py"]
