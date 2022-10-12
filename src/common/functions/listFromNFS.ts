import * as fs from 'fs';
import config from 'config';
import PgBoss from 'pg-boss';
import { PathNotExists } from '../errors';
import { addSizeToQueue, addKeyToQueue } from './queue';

function listOneLevelNFS(path: string): string[] {
  const arrayOfList: string[] = [];
  const rootDir: string = config.get('3dir');
  if (!fs.existsSync(`${rootDir}/${path}`)) {
    throw new PathNotExists(`${path} is not exists in folder ${rootDir}`);
  }
  fs.readdirSync(`${rootDir}/${path}`).forEach((file) => {
    if (fs.lstatSync(`${rootDir}/${path}/${file}`).isDirectory()) {
      arrayOfList.push(`${path}/${file}/`);
    } else {
      arrayOfList.push(`${path}/${file}`);
    }
  });

  return arrayOfList;
}

async function listNFSModelInPG(pgBoss: PgBoss, model: string): Promise<number> {
  let count = 0;
  const rootDir: string = config.get('3dir');


  if (!fs.existsSync(`${rootDir}/${model}`)) {
    throw new PathNotExists(`${model} is not exists in folder ${rootDir}`);
  }

  const folders: string[] = [model];

  while (folders.length > 0) {
    // console.log("Listing folder: " + folders[0]);

    await Promise.all(fs.readdirSync(`${rootDir}/${folders[0]}`)
    .map(async (file) => {
      if (fs.lstatSync(`${rootDir}/${folders[0]}/${file}`).isDirectory()) {
        folders.push(`${folders[0]}/${file}`);
      } else {
        count = count + 1;
        await addKeyToQueue(pgBoss, model, `${folders[0]}/${file}`);
      }
    }));

    folders.shift();
  }
  if (count == 0) {
    throw new PathNotExists(`Model ${model} doesn't exists in bucket ${config.get<string>('s3.bucket')}!`);
  }

  await addSizeToQueue(pgBoss, model, count);

  
  return count;
}

export { listOneLevelNFS, listNFSModelInPG };
