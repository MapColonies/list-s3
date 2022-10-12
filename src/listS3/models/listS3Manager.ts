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
import { listNFSModelInPG } from '../../common/functions/listFromNFS';

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

  private readonly pgBoss = new PgBoss(this.config.get<string>('pgboss'));

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger, 
    @inject(SERVICES.CONFIG) private readonly config: IConfig
    ) {
    this.pgBoss.on('error', (error) => this.logger.error(error));
  }

  public async createListManager(model: string): Promise<string> {
    try {

      const response = axios.get(this.config.get<string>('getS3') + model).catch();

      this.logger.info({
        msg: 'Listing the model in the bucket and put them in pgboss',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        pgboss: this.config.get<string>('pgboss'),
      });

      await this.pgBoss.start();
      let numOfFiles = 0;

      if (this.config.get<string>('source') == 'S3') {
        numOfFiles = await listS3ModelInPG(this.s3Client, this.pgBoss, model);
      } else if (this.config.get<string>('source') == 'NFS') {
        numOfFiles = await listNFSModelInPG(this.pgBoss, model);
      } else {
        throw new Error('Bad source!!!');
      }

      this.logger.info({
        msg: 'Successfully wrote the files in pgboss',
        model: model,
        bucket: this.config.get<string>('s3.bucket'),
        pgboss: this.config.get<string>('pgboss'),
        numOfFiles: numOfFiles,
      });

      return (await response).data as string;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      await addSizeToQueue(this.pgBoss, model, -1);
      this.logger.error({ msg: 'Failed to write the files from S3', e });

      throw e;
    }
  }
}
