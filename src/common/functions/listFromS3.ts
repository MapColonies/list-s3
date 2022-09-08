import { ListObjectsCommand, ListObjectsRequest, S3Client } from '@aws-sdk/client-s3';
import config from 'config';
import { StatusCodes } from 'http-status-codes';
import PgBoss from 'pg-boss';
import { PathNotExists } from '../errors';
import { addSizeToQueue, addKeyToQueue } from './queue';

async function getOneLevelS3(s3Client: S3Client, params: ListObjectsRequest, keysList: string[]): Promise<string[]> {

  const data = await s3Client.send(new ListObjectsCommand(params));

  if (data.$metadata.httpStatusCode != StatusCodes.OK) {
    throw new Error("Didn't list");
  }
  if (data.Contents) {
    keysList = keysList.concat(data.Contents.map((item) => (item.Key != undefined ? item.Key : '')));
  }

  if (data.CommonPrefixes) {
    keysList = keysList.concat(data.CommonPrefixes.map((item) => (item.Prefix != undefined ? item.Prefix : '')));
  }

  if (data.IsTruncated == true) {
    params.Marker = data.NextMarker;
    await getOneLevelS3(s3Client, params, keysList);
  }
  return keysList;
}

async function listS3ModelInPG(s3Client: S3Client, pgBoss: PgBoss, model: string): Promise<number> {
  const modelWithSlash = model + '/';
  let count = 0;

  /* eslint-disable @typescript-eslint/naming-convention */
  const params: ListObjectsRequest = {
    Bucket: config.get('s3.bucket'),
    Delimiter: '/',
    Prefix: modelWithSlash,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  const folders: string[] = [modelWithSlash];

  while (folders.length > 0) {
    params.Prefix = folders[0];
    await Promise.all(
      (
        await getOneLevelS3(s3Client, params, [])
      ).map(async (item) => {
        if (item.endsWith('/')) {
          folders.push(item);
        } else {
          count = count + 1;
          await addKeyToQueue(pgBoss, model, item);
        }
      })
    );
    folders.shift();
  }

  if (count == 0) {
    throw new PathNotExists(`Model ${model} doesn't exists in bucket ${config.get<string>('s3.bucket')}!`);
  }

  await addSizeToQueue(pgBoss, model, count);

  return count;
}

export { listS3ModelInPG };
