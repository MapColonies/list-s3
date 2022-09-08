import { Logger } from '@map-colonies/js-logger';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { S3Client } from '@aws-sdk/client-s3';
import PgBoss from 'pg-boss';
import axios from 'axios';
import { SERVICES } from '../../common/constants';
import { listAllModelS3 } from '../../common/functions/listFromS3';
import { addSizeToQueue, addToQueue } from '../../common/functions/queue';

@injectable()
export class ListS3Manager {
  private readonly s3Client: S3Client = new S3Client({
    endpoint: this.config.get<string>('s3.endPoint'),
    forcePathStyle: this.config.get('s3.forcePathStyle'),
    credentials: {
      accessKeyId: this.config.get<string>('s3.awsAccessKeyId'),
      secretAccessKey: this.config.get('s3.awsSecretAccessKey'),
    },
    // requestHandler: new NodeHttpHandler({connectionTimeout: 3000}),
    // maxAttempts: 3,
  });

  private readonly boss = new PgBoss(this.config.get<string>('postgres'));

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {
    this.boss.on('error', (error) => console.error(error));
  }

  public async createListManager(model: string): Promise<string> {
    try {
      let files: string[] = [];
      this.logger.info({
        msg: 'Listing the model in the bucket',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
      });

      if (this.config.get<string>('source') == 'S3') {
        files = await listAllModelS3(this.s3Client, model);
      } else if (this.config.get<string>('source') == 'NFS') {
        // files = listAllModelNFS(path);
        console.log('NFS');
      } else {
        throw new Error('Bad source!!!');
      }

      this.logger.info({
        msg: 'Successfully listed the files in array. Starting writting ',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        numOfFiles: files.length,
      });

      const response = axios.get(this.config.get<string>('getS3') + model);

      await this.boss.start();

      const numOfFiles = files.length;
      // const buffer = Number(this.config.get<string>('buffer'));
      let index = 0;

      // while (files.length - index >= buffer) {
      //   // Iterates over the files
      //   await Promise.all(files.slice(index, index + buffer).map(async key => {

      //     await addToQueue(this.boss, model, key, index);
      //     // After putting the file, increase the counter.
      //   }));
      //   index = index + buffer;
      // }

      await Promise.all(
        files.map(async (key) => {
          await addToQueue(this.boss, model, key, index);
          // After putting the file, increase the counter.
          index = index + 1;
        })
      );

      this.logger.info({
        msg: 'Successfully listed the files in array',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        numOfFiles: numOfFiles,
      });

      await addSizeToQueue(this.boss, model, numOfFiles);

      return (await response).data as string;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      await addSizeToQueue(this.boss, model, -1);
      this.logger.error({ msg: 'Failed to write the files from S3', e });
      throw e;
    }
  }
}
