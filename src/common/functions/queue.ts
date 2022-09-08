import PgBoss from 'pg-boss';

async function addToQueue(boss: PgBoss, model: string, key: string): Promise<void> {
  const jobId = await boss.send(model, { key });

  console.log(`created job in queue ${model}: ${jobId != undefined ? jobId : ''} Key: ${key}`);

  // await boss.work(queue, someAsyncJobHandler);
}

async function addSizeToQueue(boss: PgBoss, model: string, size: number): Promise<void> {
  const jobId = await boss.send(`${model}-size`, { size });

  console.log(`created job in queue ${model}: ${jobId != undefined ? jobId : ''}`);

  // await boss.work(queue, someAsyncJobHandler);
}

// async function someAsyncJobHandler(job): Promise<void> {
//   console.log(`job ${job.id} received with data:`);
//   console.log(JSON.stringify(job.data));

//   await doSomethingAsyncWithThis(job.data);
// }

export { addToQueue, addSizeToQueue };
