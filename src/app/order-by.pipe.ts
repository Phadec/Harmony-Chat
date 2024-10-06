import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform(array: any[], order: string): any[] {
    if (!array || array.length === 0) return [];
    if (order === 'desc') {
      return array.sort((a, b) => (a < b ? 1 : -1));
    }
    return array.sort((a, b) => (a > b ? 1 : -1));
  }
}
