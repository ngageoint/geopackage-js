import { IndexedAccessType } from '../../../models';
import { TypeSerializerComponent } from '../../components';
export declare class IndexedAccessTypeSerializer extends TypeSerializerComponent<IndexedAccessType> {
    supports(item: unknown): boolean;
    toObject(type: IndexedAccessType, obj?: any): any;
}
