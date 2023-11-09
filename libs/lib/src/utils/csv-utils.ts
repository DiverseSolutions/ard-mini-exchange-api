import * as stream from 'stream';
//@ts-ignore
import { parse } from 'csv-parse'
import _ from 'lodash';

function getCleanObj(obj: any) {
    let key, keys = Object.keys(obj || {});
    let n = keys.length;
    let newobj: any = {}
    let emptyCount = 0;
    while (n--) {
        key = keys[n];
        if (typeof obj[key] === 'string') {
            const sval = `${obj[key]}`.trim();
            if (sval.length === 0) {
                emptyCount++;
            }
            newobj[`${key}`.trim()] = sval;
        } else {
            newobj[`${key}`.trim()] = obj[key];
        }
    }
    if (emptyCount === keys.length) {
        return null; // empty row
    }
    return newobj;
}

function getCleanListValues(val: string | undefined): string[] {
    return _.filter(_.split(val, ',').map((r: string) => r.trim()), (v) => v?.length > 0)
}

type CleanObj = {
    [key: string]: string | null | undefined;
}

async function getCleanObjectsFromBuffer({ buffer }: { buffer: Buffer }): Promise<CleanObj[]> {
    const result: CleanObj[] = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    let rejected = false;
    return new Promise((resolve, reject) => {
        const parser = parse({
            columns: true,
            delimiter: ','
        }).on('data', (data: any) => {
            if (!rejected) {
                result.push(getCleanObj(data));
            }
        }).on('error', (err: any) => {
            rejected = true;
            reject(err);
        }).on('end', () => {
            if (!rejected) {
                resolve(result);
            }
        })
        bufferStream.pipe(parser);
    })
}

export default {
    getCleanObj,
    getCleanListValues,
    getCleanObjectsFromBuffer
}