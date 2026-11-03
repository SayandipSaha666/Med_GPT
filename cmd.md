## RABBITMQ CONNECTION MONITORING

```
 ssh -i "C:\Users\BCT-REN-2026-08-025\.ssh\id_ed25519_oracle.key" -N -L 15672:127.0.0.1:15672 ubuntu@130.61.238.155
```

```
http://localhost:15672
```

## POSTGRES DATABASE MONITORING

```
 ssh -i "C:\Users\BCT-REN-2026-08-025\.ssh\id_ed25519_oracle.key" -N -L 15433:127.0.0.1:5433 ubuntu@130.61.238.155
```

| Tab / field | Value |
|---|---|
| General → Name | `MedGPT-prod` |
| Connection → Host | `127.0.0.1` |
| Connection → Port | `15433` |
| Connection → Maintenance database |  `medgpt` |
| Connection → Username |  `postgres` |
| Connection → Password |  `password` |