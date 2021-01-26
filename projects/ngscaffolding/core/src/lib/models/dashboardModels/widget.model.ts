import { GridViewDetail } from '../datagridModels/gridViewDetail.model';
import { ChartDetailModel } from '../chartModels/chartDetail.model';
import { HTMLContentModel } from './htmlContent.model';
import { InputBuilderDefinition } from '../inputBuilderModels/inputBuilderDefinition.model';
import { BaseEntity } from '../coreModels/baseEntity.model';

export const enum WidgetTypes {
    GridView = 'gridview',
    Chart = 'chart',
    Html = 'html'
}

export interface WidgetModelBase extends BaseEntity {
    // Display Title of Widget
    title?: string;

    // Do we show the Title of the Widget?
    showTitle?: boolean;

    // Additional Class info
    className?: string;

    // As WidgetTypes Enum Above
    type: WidgetTypes | string;

    // Gallery Name allows Widget to be selected from gallery
    galleryName?: string;
    galleryIcon?: string;
    gallerySortOrder?: number;

    // Definition of the inputs that allow configuring this Widget
    inputBuilderDefinition?: InputBuilderDefinition;

    // A Value here overrides the refresh at the dashboard level (Time in Sesconds)
    refreshInterval?: number;

    // Size for a newly created Widget
    initialWidth?: number;
    initialHeight?: number;

    itemDetails?: GridViewDetail | ChartDetailModel | HTMLContentModel | any;
}
