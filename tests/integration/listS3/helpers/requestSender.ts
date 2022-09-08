import * as supertest from 'supertest';

export class ListS3RequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getResource(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/listS3').set('Content-Type', 'application/json');
  }

  public async createList(): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/listS3').set('Content-Type', 'application/json');
  }
}
