import { Injectable } from '@angular/core';

type CacheObject = Record<string, any> | Record<string, any>[];

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() { }

  private getKey(key: string): string {
    return 'Cache:' + key;
  }

  get<T extends CacheObject>(key: string, def: T): T {
    const str = localStorage.getItem(this.getKey(key));
    if (str) {
      return JSON.parse(str);
    }
    return def;
  }

  set<T extends CacheObject>(key: string, value: T): void {
    const str = JSON.stringify(value);
    localStorage.setItem(this.getKey(key), str);
  }

}
