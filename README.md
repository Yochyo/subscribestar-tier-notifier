# Subscribestar tier notifier
This is a basic attempt to get notified once one of the three limited tiers a creator I like has, have open slots again. I cannot guarantee this will work forever.

to get notified in another way than by email, just modify the `notify()` method.

## Preparation
### SMTP2Go
First of all, create a free account at (smtp2go.com)[smtp2go.com]. Then, create an api key at (https://app.smtp2go.com/sending/apikeys/)[https://app.smtp2go.com/sending/apikeys/].

### environment variables
Rename the `.env.template` file to `.env`. And follow the instructions in it.

## Running with docker
If you want to run this using docker, simply run
```bash
docker compose up -d
```
You will have to stop the container if you do not want to receive emails anymore.

## Running manually
To run this inside your terminal, first execute this to install all dependencies and build the project.
```bash
yarn install
npm run build
```

To actually run it, execute
```bash
npm run start
```


