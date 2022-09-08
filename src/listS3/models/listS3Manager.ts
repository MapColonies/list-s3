// import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Logger } from '@map-colonies/js-logger';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { S3Client } from '@aws-sdk/client-s3';
import PgBoss from 'pg-boss';
import axios from 'axios';
import { SERVICES } from '../../common/constants';
import { listS3ModelInPG } from '../../common/functions/listFromS3';
import { addSizeToQueue } from '../../common/functions/queue';

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
    maxAttempts: 3,
  });

  private readonly boss = new PgBoss(this.config.get<string>('postgres'));

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {
    this.boss.on('error', (error) => console.error(error));
  }

  public async createListManager(model: string): Promise<string> {
    try {
      this.logger.info({
        msg: 'Listing the model in the bucket and put them in pg-boss',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        pgDataBase: this.config.get<string>('postgres'),
      });

      const response = axios.get(this.config.get<string>('getS3') + model);
      await this.boss.start();
      let numOfFiles = 0;

      if (this.config.get<string>('source') == 'S3') {
        numOfFiles = await listS3ModelInPG(this.s3Client, this.boss, model);
      } else if (this.config.get<string>('source') == 'NFS') {
        // files = listAllModelNFS(path);
        console.log('NFS');
        numOfFiles = 0;
      } else {
        throw new Error('Bad source!!!');
      }

      this.logger.info({
        msg: 'Successfully wrote the files in pg-boss ',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        numOfFiles: numOfFiles,
      });

      return (await response).data as string;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      await addSizeToQueue(this.boss, model, -1);
      this.logger.error({ msg: 'Failed to write the files from S3', e });
      throw e;
    }
  }
}
