import 'reflect-metadata';

import { importx } from '@discordx/importer';

import { client } from './client';

async function bootstrap() {
  await importx(__dirname + '/{events,commands}/**/*.{ts,js}');

  if (!process.env.BOT_TOKEN) {
    throw Error('Could not find BOT_TOKEN in your environment');
  }

  await client.login(process.env.BOT_TOKEN);
}

bootstrap();
