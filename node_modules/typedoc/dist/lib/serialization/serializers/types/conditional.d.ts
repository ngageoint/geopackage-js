import { ConditionalType } from '../../../models';
import { TypeSerializerComponent } from '../../components';
export declare class ConditionalTypeSerializer extends TypeSerializerComponent<ConditionalType> {
    supports(item: unknown): boolean;
    toObject(conditional: ConditionalType, obj?: any): any;
}
