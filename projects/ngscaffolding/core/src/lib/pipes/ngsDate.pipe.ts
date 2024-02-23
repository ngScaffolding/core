import dateFormat, { masks } from 'dateformat';

import { Pipe, PipeTransform } from '@angular/core';
import { AppSettings } from '@ngscaffolding/models';
import { AppSettingsService } from '../services/appSettings/appSettings.service';

@Pipe({ name: 'ngsDate' })
export class NgsDatePipe implements PipeTransform {
    constructor(private appSettings: AppSettingsService) {}
    transform(inputDate: Date): string {
        if (inputDate) {
            // If a string gets through, convert to date object
            if (typeof inputDate === 'string' || inputDate instanceof String) {
                inputDate = new Date(inputDate);
            }

            const userTimezoneOffset = inputDate.getTimezoneOffset() * 60000;
            const zuluDate = new Date(inputDate.getTime() + userTimezoneOffset);

            const format = this.appSettings.getValue(AppSettings.dateFormat);
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
