# palomitas-transcoder

This project uses Docker and docker-compose to manage the parts of the application.

Run `docker-compose build` once to build the docker images and then run `docker-compose up` to start the redis container and the node container.

You can start a development version that listens for changes in the files with the command `docker-compose -f docker-compose.dev.yml`. In order for this to work, a `.env` file must be located in the root of the project with at least the content of the `.env.prod` file.

This only starts the backend part of the project, listening on port 4000. To start the Web UI you nedd to `cd` into the `www` folder, run `npm install` (only once to create the `node_modules` folder) and run `npm start`. The web will be located on http://localhost:3000

### transcoder details

It only transcodes to webm now, with a video bitrate of 1024k and an audio bitrate of 128k. However, it can run any ffmpeg command that is implemented. Other ffmpeg parameters used are '-crf 17', '-error-resilient 1', '-deadline good', '-cpu-used 2'
