import { ReferenceReflection } from '../../../models';
import { ReflectionSerializerComponent } from '../../components';
export declare class ReferenceReflectionSerializer extends ReflectionSerializerComponent<ReferenceReflection> {
    supports(t: unknown): boolean;
    toObject(ref: ReferenceReflection, obj?: any): any;
}
