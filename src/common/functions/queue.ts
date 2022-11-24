import PgBoss, { SendOptions } from 'pg-boss';

async function addKeyToQueue(boss: PgBoss, model: string, key: string): Promise<void> {
  const options: SendOptions = {
    retentionHours: 10,
  };

  const jobId = await boss.send(model, { key }, options);
  if (jobId != undefined) {
    await boss.complete(jobId);
    console.log(`created job in queue ${jobId}, Key: ${key}`);
  } else {
    throw new Error("Got null jobId from pg-boss");
  }

}

async function addSizeToQueue(boss: PgBoss, model: string, size: number): Promise<void> {
  const options: SendOptions = {
    retentionHours: 10,
  };

  const jobId = await boss.send(`${model}-size`, { size }, options);

  console.log(`created size in queue ${model}: ${jobId != undefined ? jobId : ''}`);
}

export { addKeyToQueue, addSizeToQueue };
