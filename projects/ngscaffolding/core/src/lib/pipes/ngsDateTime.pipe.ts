import dateFormat, { masks } from 'dateformat';

import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingsQuery } from '../services/appSettings/appSettings.query';
import { AppSettings } from '@ngscaffolding/models';

@Pipe({ name: 'ngsDateTime' })
export class NgsDateTimePipe implements PipeTransform {
  constructor(private appSettings: AppSettingsQuery) {}
  transform(inputDate: Date): string {
    if (inputDate) {
      if (Array.isArray(inputDate)) {
        inputDate = inputDate[0];
      }
      
      // If a string gets through, convert to date object
      if (typeof inputDate === 'string' || inputDate instanceof String) {
        inputDate = new Date(inputDate);
      }

      const userTimezoneOffset = inputDate.getTimezoneOffset() * 60000;
      const zuluDate = new Date(inputDate.getTime() + userTimezoneOffset);

      const format = this.appSettings.getEntity(AppSettings.dateTimeFormat);
      if (format && format.value) {
        return dateFormat(zuluDate, format.value);
      } else {
        return dateFormat(zuluDate, 'default');
      }
    } else {
      return '';
    }
  }
}
