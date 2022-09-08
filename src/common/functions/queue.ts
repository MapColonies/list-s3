import PgBoss, { SendOptions } from 'pg-boss';

async function addKeyToQueue(boss: PgBoss, model: string, key: string): Promise<void> {
  const options: SendOptions = {
    retentionHours: 10,
  };

  const jobId = await boss.send(model, { key }, options);

  console.log(`created job in queue ${model}: ${jobId != undefined ? jobId : ''} Key: ${key}`);
}

async function addSizeToQueue(boss: PgBoss, model: string, size: number): Promise<void> {
  const options: SendOptions = {
    retentionHours: 10,
  };

  const jobId = await boss.send(`${model}-size`, { size }, options);

  console.log(`created size in queue ${model}: ${jobId != undefined ? jobId : ''}`);
}

export { addKeyToQueue, addSizeToQueue };
