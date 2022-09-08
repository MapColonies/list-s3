import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ListS3Controller } from '../controllers/listS3Controller';

const listS3RouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ListS3Controller);

  router.post('/:modelPath', controller.createList);

  return router;
};

export const LIST_S3_ROUTER_SYMBOL = Symbol('listS3RouterFactory');

export { listS3RouterFactory };
