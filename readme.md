

| Key               | Default       |
| ----------------- | ------------- |
| STORE_HOST        | localhost     |
| STORE_DB          | althingi      |
| STORE_PORT        | 27017         |
| STORE_USER        | wo            |
| STORE_PASSWORD    | long@pass!123 |
| QUEUE_PROTOCOL    | amqp          |
| QUEUE_HOST        | localhost     |
| QUEUE_PORT        | 5672          |
| QUEUE_USER        | guest         |
| QUEUE_PASSWORD    | guest         |
| API_HOST          | localhost     |



mongoimport --username=wo --password='long@pass!123' -d althingi -c vote /home/vote-149.json


mongoexport --username=wo --password='long@pass!123' -d althingi -c vote --out /home/vote-149.json

scp althingi:/root/AlthingiMaster/assets/vote-149.json /Users/einar.adalsteinsson/Desktop/dump