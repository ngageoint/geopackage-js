import { InferredType } from '../../../models';
import { TypeSerializerComponent } from '../../components';
export declare class InferredTypeSerializer extends TypeSerializerComponent<InferredType> {
    supports(item: unknown): boolean;
    toObject(inferred: InferredType, obj?: any): any;
}
