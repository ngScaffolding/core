import { Pipe, PipeTransform } from '@angular/core';
import { ButtonColours } from '../models/coreModels/action.model';

@Pipe({ name: 'buttonColour' })
export class ButtonColourPipe implements PipeTransform {
  transform(inputColor: string): string {
    let returnColor: string;

    switch (inputColor) {
      case ButtonColours.primary: {
        returnColor = 'p-button-primary';
        break;
      }
      case ButtonColours.secondary: {
        returnColor = 'p-button-secondary';
        break;
      }
      case ButtonColours.success: {
        returnColor = 'p-button-success';
        break;
      }
      case ButtonColours.info: {
        returnColor = 'p-button-info';
        break;
      }
      case ButtonColours.warning: {
        returnColor = 'p-button-warning';
        break;
      }
      case ButtonColours.danger: {
        returnColor = 'p-button-danger';
        break;
      }
      case ButtonColours.blue: {
        returnColor = 'blue-grey-btn';
        break;
      }
      case ButtonColours.cyan: {
        returnColor = 'cyan-btn';
        break;
      }
      case ButtonColours.teal: {
        returnColor = 'teal-btn';
        break;
      }
      case ButtonColours.orange: {
        returnColor = 'orange-btn';
        break;
      }
      case ButtonColours.deeporange: {
        returnColor = 'deep-orange-btn';
        break;
      }
      case ButtonColours.purple: {
        returnColor = 'purple-btn';
        break;
      }
      case ButtonColours.indigo: {
        returnColor = 'indigo-btn';
        break;
      }
      case ButtonColours.pink: {
        returnColor = 'pink-btn';
        break;
      }
      default: {
        returnColor = 'p-button-info';
      }
    }
    return returnColor;
  }
}
