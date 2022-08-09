import { Pipe, PipeTransform } from '@angular/core';
import { IWeaponResult } from '../types/app';

@Pipe({
  name: 'getResult'
})
export class GetResultPipe implements PipeTransform {

  transform(value: IWeaponResult[], uuid: string): IWeaponResult | undefined {
    return value.find(x => x.uuid === uuid);
  }

}
