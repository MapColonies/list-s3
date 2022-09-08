import jsLogger from '@map-colonies/js-logger';
import { ListS3Manager } from '../../../../src/listS3/models/listS3Manager';

let listS3Manager: ListS3Manager;

describe('ListS3Manager', () => {
  beforeEach(function () {
    listS3Manager = new ListS3Manager(jsLogger({ enabled: false }));
  });
  describe('#createList', () => {
    it('return the resource of id 1', function () {
      // action
      const resource = listS3Manager.createList({ description: 'meow', name: 'cat' });

      // expectation
      expect(resource.id).toBeLessThanOrEqual(100);
      expect(resource.id).toBeGreaterThanOrEqual(0);
      expect(resource).toHaveProperty('name', 'cat');
      expect(resource).toHaveProperty('description', 'meow');
    });
  });
});
