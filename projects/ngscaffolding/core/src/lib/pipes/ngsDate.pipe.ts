import dateFormat, { masks } from 'dateformat';

import { Pipe, PipeTransform } from '@angular/core';
import { AppSettings } from '@ngscaffolding/models';
import { AppSettingsService } from '../services/appSettings/appSettings.service';

@Pipe({
    name: 'ngsDate',
    standalone: true
})
export class NgsDatePipe implements PipeTransform {
    constructor(private appSettings: AppSettingsService) {}
    transform(inputDate: Date | undefined): string {
        try {
        if (inputDate) {
            // If a string gets through, convert to date object
            if (typeof inputDate === 'string' || inputDate instanceof String) {
                inputDate = new Date(inputDate);
            }

            const format = this.appSettings.getValue(AppSettings.dateFormat);
            if (format) {
                return dateFormat(inputDate, format, true);
            } else {
                return dateFormat(inputDate, 'default', true);
            }
        } else {
                return '';
            }
        } catch (e) {
            console.error(e);
            return '';
        }
    }
}
